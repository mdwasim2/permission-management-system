import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalog() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { key: 'asc' }],
    });
    const grouped = permissions.reduce<Record<string, string[]>>((acc, permission) => {
      acc[permission.module] = [...(acc[permission.module] ?? []), permission.key];
      return acc;
    }, {});
    const groups = Object.entries(grouped).map(([module, modulePermissions]) => ({
      module,
      permissions: modulePermissions,
    }));

    return {
      totalModules: groups.length,
      groups,
    };
  }
}