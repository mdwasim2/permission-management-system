import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('api info', () => {
    it('should return API metadata', () => {
      expect(appController.getApiInfo()).toMatchObject({
        name: 'dynamic-rbac-api',
        status: 'bootstrapped',
      });
    });
  });

  describe('health', () => {
    it('should return healthy state', () => {
      expect(appController.getHealth()).toMatchObject({
        ok: true,
      });
    });
  });
});
