import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;
  const health = {
    status: 'ok',
    service: 'music-api',
    database: 'connected',
    timestamp: '2026-08-28T00:00:00.000Z',
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHealth: vi.fn().mockResolvedValue(health),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return the service health state', async () => {
      await expect(appController.getHealth()).resolves.toEqual(health);
    });
  });
});
