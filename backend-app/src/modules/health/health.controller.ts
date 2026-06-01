import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { AppHealthResponseDto, DbHealthResponseDto } from './dto/health-response.dto';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @ApiOkResponse({ type: AppHealthResponseDto, description: 'Application health status' })
  getHealth() { return this.healthService.getAppHealth(); }

  @Get('health/db')
  @ApiOkResponse({ type: DbHealthResponseDto, description: 'Database health status' })
  getDbHealth() { return this.healthService.getDbHealth(); }
}
