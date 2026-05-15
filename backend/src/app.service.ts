import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiInfo() {
    return {
      name: 'dynamic-rbac-api',
      version: '0.1.0',
      status: 'bootstrapped',
      modules: ['auth', 'users', 'permissions', 'audit'],
    };
  }

  getHealth() {
    return {
      ok: true,
      timestamp: new Date().toISOString(),
    };
  }
}
