import { Injectable } from '@nestjs/common';
import { permissionGroups } from './permission-catalog';

@Injectable()
export class PermissionsService {
  getCatalog() {
    return {
      totalModules: permissionGroups.length,
      groups: permissionGroups,
    };
  }
}