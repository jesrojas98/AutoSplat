import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// GET /api y GET /api/health: los usa el health check de Render (render.yaml)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return this.appService.getHealth();
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
