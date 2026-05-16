import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoleKey, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { permissionCatalog } from '../permissions/permission-catalog';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SetUserPermissionsDto } from './dto/set-user-permissions.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const roleRank: Record<RoleKey, number> = {
  [RoleKey.ADMIN]: 4,
  [RoleKey.MANAGER]: 3,
  [RoleKey.AGENT]: 2,
  [RoleKey.CUSTOMER]: 1,
};
const managerManagedRoleKeys: RoleKey[] = [RoleKey.AGENT, RoleKey.CUSTOMER];

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getUsers(request: Request) {
    const actor = await this.requirePermission(request, 'users.view');
    const where: Prisma.UserWhereInput =
      actor.role.key === RoleKey.MANAGER
        ? {
            OR: [{ id: actor.id }, { managerId: actor.id }],
          }
        : {};

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        role: true,
        directPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return {
      actor: {
        id: actor.id,
        role: actor.role,
        permissions: actor.permissions,
      },
      assignableRoles: this.getAssignableRoles(actor.role.key),
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        suspendedAt: user.suspendedAt,
        bannedAt: user.bannedAt,
        createdAt: user.createdAt,
        role: user.role,
        directPermissions: user.directPermissions.map((permission) => ({
          key: permission.permission.key,
          allowed: permission.allowed,
        })),
      })),
      grantablePermissions: actor.permissions,
    };
  }

  async createUser(createUserDto: CreateUserDto, request: Request) {
    const actor = await this.requirePermission(request, 'users.create');
    this.ensureRoleAssignableByActor(actor.role.key, createUserDto.roleKey);
    this.ensureRoleWithinCeiling(actor.role.key, createUserDto.roleKey);
    this.ensureGrantCeiling(actor.permissions, createUserDto.permissions ?? []);
    await this.ensurePermissionCatalog();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const role = await this.ensureRole(createUserDto.roleKey);
    const permissionRecords = await this.prisma.permission.findMany({
      where: { key: { in: createUserDto.permissions ?? [] } },
    });

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email.toLowerCase(),
        passwordHash: await hash(createUserDto.password, 10),
        roleId: role.id,
        managerId: actor.role.key === RoleKey.MANAGER ? actor.id : null,
        directPermissions: {
          create: permissionRecords.map((permission) => ({
            permissionId: permission.id,
            allowed: true,
          })),
        },
      },
      include: {
        role: true,
      },
    });

    await this.writeAuditLog({
      actorId: actor.id,
      action: 'user.create',
      targetType: 'user',
      targetId: user.id,
      targetUserId: user.id,
      metadata: {
        roleKey: createUserDto.roleKey,
        permissions: createUserDto.permissions ?? [],
      },
    });

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

  async updateUser(userId: string, updateUserDto: UpdateUserDto, request: Request) {
    const actor = await this.requirePermission(request, 'users.edit');
    const targetUser = await this.getManageableUser(userId, actor);

    if (updateUserDto.roleKey) {
      this.ensureRoleAssignableByActor(actor.role.key, updateUserDto.roleKey);
      this.ensureRoleWithinCeiling(actor.role.key, updateUserDto.roleKey);
    }

    if (updateUserDto.email && updateUserDto.email.toLowerCase() !== targetUser.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictException('A user with this email already exists');
      }
    }

    const nextRole = updateUserDto.roleKey
      ? await this.ensureRole(updateUserDto.roleKey)
      : null;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: updateUserDto.name,
        email: updateUserDto.email?.toLowerCase(),
        roleId: nextRole?.id,
        status: updateUserDto.status,
        suspendedAt:
          updateUserDto.status === UserStatus.SUSPENDED ? new Date() : updateUserDto.status === UserStatus.ACTIVE ? null : undefined,
        bannedAt:
          updateUserDto.status === UserStatus.BANNED ? new Date() : updateUserDto.status === UserStatus.ACTIVE ? null : undefined,
      },
      include: { role: true },
    });

    if (updateUserDto.status && updateUserDto.status !== UserStatus.ACTIVE) {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }

    await this.writeAuditLog({
      actorId: actor.id,
      action: 'user.update',
      targetType: 'user',
      targetId: userId,
      targetUserId: userId,
      metadata: {
        name: updateUserDto.name,
        email: updateUserDto.email,
        roleKey: updateUserDto.roleKey,
        status: updateUserDto.status,
      },
    });

    return { user: updatedUser };
  }

  async suspendUser(userId: string, request: Request) {
    const actor = await this.requirePermission(request, 'users.suspend');
    await this.getManageableUser(userId, actor);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.SUSPENDED,
        suspendedAt: new Date(),
      },
      include: { role: true },
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    await this.writeAuditLog({
      actorId: actor.id,
      action: 'user.suspend',
      targetType: 'user',
      targetId: userId,
      targetUserId: userId,
    });

    return { user };
  }

  async banUser(userId: string, request: Request) {
    const actor = await this.requirePermission(request, 'users.ban');
    await this.getManageableUser(userId, actor);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.BANNED,
        bannedAt: new Date(),
      },
      include: { role: true },
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    await this.writeAuditLog({
      actorId: actor.id,
      action: 'user.ban',
      targetType: 'user',
      targetId: userId,
      targetUserId: userId,
    });

    return { user };
  }

  async setUserPermissions(
    userId: string,
    setUserPermissionsDto: SetUserPermissionsDto,
    request: Request,
  ) {
    const actor = await this.requirePermission(request, 'users.edit');
    const targetUser = await this.getManageableUser(userId, actor);
    if (actor.role.key === RoleKey.MANAGER && targetUser.role.key !== RoleKey.AGENT) {
      throw new ForbiddenException('Managers can only set permissions for agents');
    }
    this.ensureGrantCeiling(
      actor.permissions,
      setUserPermissionsDto.permissions.map((permission) => permission.permissionKey),
    );
    await this.ensurePermissionCatalog();

    const catalogPermissions = await this.prisma.permission.findMany({
      where: {
        key: {
          in: setUserPermissionsDto.permissions.map((permission) => permission.permissionKey),
        },
      },
    });

    await Promise.all(
      catalogPermissions.map((permission) => {
        const override = setUserPermissionsDto.permissions.find(
          (entry) => entry.permissionKey === permission.key,
        );

        return this.prisma.userPermission.upsert({
          where: {
            userId_permissionId: {
              userId,
              permissionId: permission.id,
            },
          },
          update: { allowed: override?.allowed ?? false },
          create: {
            userId,
            permissionId: permission.id,
            allowed: override?.allowed ?? false,
          },
        });
      }),
    );

    await this.writeAuditLog({
      actorId: actor.id,
      action: 'user.permissions.update',
      targetType: 'user',
      targetId: userId,
      targetUserId: userId,
      metadata: {
        permissions: setUserPermissionsDto.permissions.map((permission) => ({
          permissionKey: permission.permissionKey,
          allowed: permission.allowed,
        })),
      },
    });

    return { success: true };
  }

  private async requirePermission(request: Request, permission: string) {
    const actor = await this.authService.getSessionUser(request);

    if (!actor.permissions.includes(permission)) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return actor;
  }

  private async getManageableUser(
    userId: string,
    actor: { id: string; role: { key: RoleKey } },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (actor.role.key === RoleKey.ADMIN) {
      return user;
    }

    if (actor.id === user.id) {
      throw new ForbiddenException('You cannot manage your own account from this endpoint');
    }

    if (
      actor.role.key === RoleKey.MANAGER &&
      (!user.managerId || user.managerId !== actor.id || !managerManagedRoleKeys.includes(user.role.key))
    ) {
      throw new ForbiddenException('Managers can only manage agents and customers in their own team');
    }

    if (roleRank[user.role.key] > roleRank[actor.role.key]) {
      throw new ForbiddenException('You cannot manage a user above your role ceiling');
    }

    return user;
  }

  private ensureRoleWithinCeiling(actorRoleKey: RoleKey, nextRoleKey: RoleKey) {
    if (roleRank[nextRoleKey] > roleRank[actorRoleKey]) {
      throw new ForbiddenException('You cannot grant a role above your own level');
    }
  }

  private ensureRoleAssignableByActor(actorRoleKey: RoleKey, nextRoleKey: RoleKey) {
    if (actorRoleKey === RoleKey.MANAGER && !managerManagedRoleKeys.includes(nextRoleKey)) {
      throw new ForbiddenException('Managers can only create or assign AGENT and CUSTOMER roles');
    }
  }

  private getAssignableRoles(actorRoleKey: RoleKey) {
    if (actorRoleKey === RoleKey.ADMIN) {
      return Object.values(RoleKey);
    }

    if (actorRoleKey === RoleKey.MANAGER) {
      return managerManagedRoleKeys;
    }

    return [];
  }

  private ensureGrantCeiling(actorPermissions: string[], permissions: string[]) {
    const deniedPermission = permissions.find(
      (permission) => !actorPermissions.includes(permission),
    );

    if (deniedPermission) {
      throw new ForbiddenException('You cannot grant permissions that you do not hold');
    }
  }

  private async ensureRole(roleKey: RoleKey) {
    return this.prisma.role.upsert({
      where: { key: roleKey },
      update: {},
      create: {
        key: roleKey,
        label: roleKey.charAt(0) + roleKey.slice(1).toLowerCase(),
      },
    });
  }

  private async ensurePermissionCatalog() {
    await Promise.all(
      Object.entries(permissionCatalog).flatMap(([module, permissions]) =>
        permissions.map((key) =>
          this.prisma.permission.upsert({
            where: { key },
            update: {
              module,
              label: key,
            },
            create: {
              module,
              key,
              label: key,
            },
          }),
        ),
      ),
    );
  }

  private async writeAuditLog(input: {
    actorId: string;
    action: string;
    targetType: string;
    targetId: string;
    targetUserId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    await this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        targetUserId: input.targetUserId,
        metadata: input.metadata,
      },
    });
  }
}
