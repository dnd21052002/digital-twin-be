import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { AssetIdParamDto, AssetMetricsQueryDto } from './dto/metrics-query.dto';
import { LatestMetricsResponseDto, MetricTimeseriesResponseDto } from './dto/metrics-response.dto';
import { TelemetryService } from './telemetry.service';

@ApiTags('telemetry')
@ApiBearerAuth()
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('assets/:assetId/metrics')
export class TelemetryController {
  constructor(private readonly telemetry: TelemetryService) {}

  @Get('latest')
  @ApiOperation({ summary: 'Return latest metric per metric key for an asset.' })
  @ApiOkResponse({ type: LatestMetricsResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  latestMetrics(@Param() params: AssetIdParamDto) {
    return this.telemetry.latestMetrics(params.assetId);
  }

  @Get('timeseries')
  @ApiOperation({ summary: 'Return asset metric chart points for a time range.' })
  @ApiOkResponse({ type: MetricTimeseriesResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  metricTimeseries(@Param() params: AssetIdParamDto, @Query() query: AssetMetricsQueryDto) {
    return this.telemetry.metricTimeseries(params.assetId, query);
  }
}
