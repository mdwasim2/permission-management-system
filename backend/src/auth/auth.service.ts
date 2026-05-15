import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
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
      nextStep: 'Implement login, refresh, logout, and blacklist flow',
    };
  }
}