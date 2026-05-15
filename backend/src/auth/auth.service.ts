import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoleKey, UserStatus } from '@prisma/client';
import { hash, compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
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

    return this.buildAuthResponse(user, 'Account created successfully');
  }

  async login(loginDto: LoginDto) {
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

    return this.buildAuthResponse(user, 'Login successful');
  }

  getSessionContract() {
    return {
      accessToken: {
        transport: 'memory',
        ttlMinutes: 15,
      },
      refreshToken: {
        transport: 'httpOnly-cookie',
        ttlDays: 7,
      },
      endpoints: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
      },
    };
  }

  private buildAuthResponse(
    user: {
      id: string;
      name: string;
      email: string;
      status: UserStatus;
      role: { key: RoleKey; label: string };
    },
    message: string,
  ) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role.key,
    });

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
}