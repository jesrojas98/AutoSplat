import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('GET / responde status ok (health check de Render)', () => {
    expect(appController.getRoot()).toMatchObject({ status: 'ok' });
  });

  it('GET /health responde status ok y uptime numérico', () => {
    const res = appController.getHealth();
    expect(res.status).toBe('ok');
    expect(typeof res.uptime).toBe('number');
  });
});
