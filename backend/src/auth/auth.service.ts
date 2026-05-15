import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleKey, UserStatus } from '@prisma/client';
import { hash, compare } from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto, response: Response) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const customerRole = await this.prisma.role.upsert({
      where: { key: RoleKey.CUSTOMER },
      update: {},
      create: {
        key: RoleKey.CUSTOMER,
        label: 'Customer',
      },
    });

    const passwordHash = await hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: registerDto.name,
        email: registerDto.email.toLowerCase(),
        passwordHash,
        roleId: customerRole.id,
      },
      include: {
        role: true,
      },
    });

    return this.createSession(user, response, 'Account created successfully');
  }

  async login(loginDto: LoginDto, response: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase() },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('This account is not active');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.createSession(user, response, 'Login successful');
  }

  async refresh(request: Request, response: Response) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (
      !storedToken ||
      storedToken.userId !== payload.sub ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    // Rotate the refresh token on every use so old cookies cannot be replayed.
    await this.prisma.refreshToken.delete({
      where: { tokenHash },
    });

    return this.createSession(
      storedToken.user,
      response,
      'Session refreshed successfully',
    );
  }

  async logout(request: Request, response: Response) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE];

    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { tokenHash: this.hashToken(refreshToken) },
      });
    }

    this.clearSessionCookies(response);

    return {
      message: 'Logged out successfully',
    };
  }

  async me(request: Request) {
    const accessToken = this.extractAccessToken(request);

    if (!accessToken) {
      throw new UnauthorizedException('Access token is missing');
    }

    const payload = await this.verifyAccessToken(accessToken);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        role: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User is not active');
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role,
      },
    };
  }

  getSessionContract() {
    return {
      accessToken: {
        transport: 'httpOnly-cookie',
        ttlMinutes: 15,
      },
      refreshToken: {
        transport: 'httpOnly-cookie',
        ttlDays: 7,
      },
      endpoints: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me',
      },
    };
  }

  private async createSession(
    user: {
      id: string;
      name: string;
      email: string;
      status: UserStatus;
      role: { key: RoleKey; label: string };
    },
    response: Response,
    message: string,
  ) {
    // The short-lived access token drives normal API access.
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role.key,
    });

    // The refresh token is persisted server-side as a hash and can mint a new access token.
    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        tokenId: randomBytes(16).toString('hex'),
      },
      {
        secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
        expiresIn: `${REFRESH_TOKEN_TTL_SECONDS}s`,
    // Keep a single active refresh token per user for this starter auth flow.
      },
    );

    await this.prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    });

    this.setSessionCookies(response, accessToken, refreshToken);

    return {
      message,
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role,
      },
    };
  }

  private setSessionCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    // Both tokens stay in httpOnly cookies so middleware and server requests can see them.
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    response.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
    });
    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    });
  }

  private clearSessionCookies(response: Response) {
    response.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    response.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private extractAccessToken(request: Request) {
    const authorization = request.headers.authorization;

    if (authorization?.startsWith('Bearer ')) {
      return authorization.slice(7);
    }

    return request.cookies?.[ACCESS_TOKEN_COOKIE];
  }

  private verifyAccessToken(token: string) {
    try {
      return this.jwtService.verify<{ sub: string; email: string; role: RoleKey }>(
        token,
      );
    } catch {
      throw new UnauthorizedException('Access token is invalid');
    }
  }

  private verifyRefreshToken(token: string) {
    try {
      return this.jwtService.verify<{ sub: string; tokenId: string }>(token, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Refresh token is invalid');
    }
  }
}