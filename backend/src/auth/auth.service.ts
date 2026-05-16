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
import { permissionCatalog } from '../permissions/permission-catalog';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_BLOCK_WINDOW_MS = 15 * 60 * 1000;

const rolePermissionDefaults: Record<RoleKey, string[]> = {
  [RoleKey.ADMIN]: Object.values(permissionCatalog).flat(),
  [RoleKey.MANAGER]: [
    ...permissionCatalog.dashboard,
    ...permissionCatalog.users,
    ...permissionCatalog.leads,
    ...permissionCatalog.tasks,
    ...permissionCatalog.reports,
    ...permissionCatalog.audit,
    ...permissionCatalog.customerPortal,
  ],
  [RoleKey.AGENT]: [
    ...permissionCatalog.dashboard,
    ...permissionCatalog.leads,
    ...permissionCatalog.tasks,
    ...permissionCatalog.customerPortal,
  ],
  [RoleKey.CUSTOMER]: [
    ...permissionCatalog.customerPortal,
  ],
};

const navigationItems = [
  { label: 'Dashboard', href: '/dashboard', permission: 'dashboard.view', group: 'Workspace' },
  { label: 'Users', href: '/users', permission: 'users.view', group: 'Workspace' },
  { label: 'Leads', href: '/leads', permission: 'leads.view', group: 'Workspace' },
  { label: 'Tasks', href: '/tasks', permission: 'tasks.view', group: 'Workspace' },
  { label: 'Reports', href: '/reports', permission: 'reports.view', group: 'Workspace' },
  { label: 'Audit Log', href: '/audit-log', permission: 'audit.view', group: 'Workspace' },
  { label: 'Customer Portal', href: '/customer-portal', permission: 'customer-portal.view', group: 'Users' },
  { label: 'Settings', href: '/settings', permission: 'settings.manage', group: 'Other' },
] as const;

@Injectable()
export class AuthService {
  private readonly failedLoginAttempts = new Map<
    string,
    { count: number; blockedUntil?: number }
  >();

  private readonly blacklistedAccessTokens = new Map<string, number>();

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
    this.ensureLoginNotBlocked(loginDto.email);

    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase() },
      include: {
        role: true,
      },
    });

    if (!user) {
      this.recordFailedLogin(loginDto.email);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      this.recordFailedLogin(loginDto.email);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('This account is not active');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    this.clearFailedLogins(loginDto.email);

    return this.createSession(user, response, 'Login successful');
  }

  async refresh(request: Request, response: Response) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE];
    const currentAccessToken = this.extractAccessToken(request);

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

    if (currentAccessToken) {
      this.blacklistAccessToken(currentAccessToken);
    }

    return this.createSession(
      storedToken.user,
      response,
      'Session refreshed successfully',
    );
  }

  async logout(request: Request, response: Response) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE];
    const accessToken = this.extractAccessToken(request);

    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { tokenHash: this.hashToken(refreshToken) },
      });
    }

    if (accessToken) {
      this.blacklistAccessToken(accessToken);
    }

    this.clearSessionCookies(response);

    return {
      message: 'Logged out successfully',
    };
  }

  async me(request: Request) {
    const sessionUser = await this.getSessionUser(request);

    return {
      user: {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        status: sessionUser.status,
        role: sessionUser.role,
        permissions: sessionUser.permissions,
        navigation: this.buildNavigation(sessionUser.permissions),
      },
    };
  }

  async getSessionUser(request: Request) {
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

    const permissions = await this.resolvePermissions(user.id, user.role.key);

    return {
      ...user,
      permissions,
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
      permissions: await this.resolvePermissions(user.id, user.role.key),
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
      },
    );

    // Keep a single active refresh token per user for this starter auth flow.
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
        permissions: await this.resolvePermissions(user.id, user.role.key),
        navigation: this.buildNavigation(
          await this.resolvePermissions(user.id, user.role.key),
        ),
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
      this.pruneBlacklistedTokens();

      if (this.blacklistedAccessTokens.has(this.hashToken(token))) {
        throw new UnauthorizedException('Access token is blacklisted');
      }

      return this.jwtService.verify<{
        sub: string;
        email: string;
        role: RoleKey;
        permissions: string[];
      }>(
        token,
      );
    } catch {
      throw new UnauthorizedException('Access token is invalid');
    }
  }

  private ensureLoginNotBlocked(email: string) {
    const state = this.failedLoginAttempts.get(email.toLowerCase());

    if (state?.blockedUntil && state.blockedUntil > Date.now()) {
      throw new UnauthorizedException('Too many failed attempts. Try again later');
    }
  }

  private recordFailedLogin(email: string) {
    const key = email.toLowerCase();
    const current = this.failedLoginAttempts.get(key);
    const nextCount = (current?.count ?? 0) + 1;

    this.failedLoginAttempts.set(key, {
      count: nextCount,
      blockedUntil:
        nextCount >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOGIN_BLOCK_WINDOW_MS : undefined,
    });
  }

  private clearFailedLogins(email: string) {
    this.failedLoginAttempts.delete(email.toLowerCase());
  }

  private blacklistAccessToken(token: string) {
    const decodedToken = this.jwtService.decode(token) as { exp?: number } | null;
    const expiresAt = decodedToken?.exp ? decodedToken.exp * 1000 : Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000;

    this.blacklistedAccessTokens.set(this.hashToken(token), expiresAt);
    this.pruneBlacklistedTokens();
  }

  private pruneBlacklistedTokens() {
    const now = Date.now();

    for (const [tokenHash, expiresAt] of this.blacklistedAccessTokens.entries()) {
      if (expiresAt <= now) {
        this.blacklistedAccessTokens.delete(tokenHash);
      }
    }
  }

  private async resolvePermissions(userId: string, roleKey: RoleKey) {
    if (roleKey === RoleKey.ADMIN) {
      return [...new Set(Object.values(permissionCatalog).flat())].sort((left, right) =>
        left.localeCompare(right),
      );
    }

    const basePermissions = new Set(rolePermissionDefaults[roleKey] ?? []);
    const overrides = await this.prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    for (const override of overrides) {
      if (override.allowed) {
        basePermissions.add(override.permission.key);
        continue;
      }

      basePermissions.delete(override.permission.key);
    }

    return [...basePermissions].sort((left, right) => left.localeCompare(right));
  }

  private buildNavigation(permissions: string[]) {
    return navigationItems.filter((item) => permissions.includes(item.permission));
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