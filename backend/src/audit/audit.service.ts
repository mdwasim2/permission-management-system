import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getAuditLogs(request: Request) {
    const actor = await this.authService.getSessionUser(request);

    if (!actor.permissions.includes('audit.view')) {
      throw new ForbiddenException('You do not have permission to view audit logs');
    }

    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          include: {
            role: true,
          },
        },
        targetUser: {
          include: {
            role: true,
          },
        },
      },
      take: 100,
    });

    return { logs };
  }
}
