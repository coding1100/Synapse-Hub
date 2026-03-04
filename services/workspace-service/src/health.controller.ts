import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  status() {
    return {
      service: 'workspace-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
