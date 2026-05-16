import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, RoleKey } from '@prisma/client';
import { existsSync } from 'fs';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';
import { permissionCatalog } from '../permissions/permission-catalog';

const envCandidates = [
  join(process.cwd(), '.env'),
  join(process.cwd(), 'backend/.env'),
];

const envPath = envCandidates.find((candidate) => existsSync(candidate));

if (envPath) {
  loadEnv({ path: envPath });
}

const defaultRolePermissions: Record<RoleKey, string[]> = {
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
  [RoleKey.CUSTOMER]: [...permissionCatalog.customerPortal],
};

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super(
      process.env.DATABASE_URL
        ? {
            datasources: {
              db: {
                url: process.env.DATABASE_URL,
              },
            },
          }
        : undefined,
    );
  }

  async onModuleInit() {
    await this.$connect();
    await this.seedAccessModel();
  }

  private async seedAccessModel() {
    const roles = await Promise.all(
      Object.values(RoleKey).map((roleKey) =>
        this.role.upsert({
          where: { key: roleKey },
          update: {
            label: roleKey.charAt(0) + roleKey.slice(1).toLowerCase(),
          },
          create: {
            key: roleKey,
            label: roleKey.charAt(0) + roleKey.slice(1).toLowerCase(),
          },
        }),
      ),
    );

    await Promise.all(
      Object.entries(permissionCatalog).flatMap(([module, permissions]) =>
        permissions.map((key) =>
          this.permission.upsert({
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

    const allPermissions = await this.permission.findMany({
      select: { id: true, key: true },
    });
    const permissionIdByKey = new Map(allPermissions.map((permission) => [permission.key, permission.id]));

    await Promise.all(
      roles.flatMap((role) => {
        const keys = defaultRolePermissions[role.key] ?? [];

        return keys
          .map((permissionKey) => permissionIdByKey.get(permissionKey))
          .filter((permissionId): permissionId is string => Boolean(permissionId))
          .map((permissionId) =>
            this.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: role.id,
                  permissionId,
                },
              },
              update: {},
              create: {
                roleId: role.id,
                permissionId,
              },
            }),
          );
      }),
    );
  }
}
