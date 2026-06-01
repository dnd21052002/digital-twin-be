import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { AssetIdParamDto, AssetMetricsQueryDto } from './dto/metrics-query.dto';
import { TelemetryService } from './telemetry.service';

@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('assets/:assetId/metrics')
export class TelemetryController {
  constructor(private readonly telemetry: TelemetryService) {}

  @Get('latest')
  latestMetrics(@Param() params: AssetIdParamDto) {
    return this.telemetry.latestMetrics(params.assetId);
  }

  @Get('timeseries')
  metricTimeseries(@Param() params: AssetIdParamDto, @Query() query: AssetMetricsQueryDto) {
    return this.telemetry.metricTimeseries(params.assetId, query);
  }
}
