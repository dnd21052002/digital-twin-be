import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}
  @Get('health')
  @ApiOkResponse({ description: 'Application health status' })
  getHealth() { return this.healthService.getAppHealth(); }
  @Get('health/db')
  @ApiOkResponse({ description: 'Database health status' })
  getDbHealth() { return this.healthService.getDbHealth(); }
}
