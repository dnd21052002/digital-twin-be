import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { KpiTimeseriesQueryDto } from './dto/kpi-query.dto';
import { KpiLatestResponseDto, KpiTimeseriesResponseDto } from './dto/kpi-response.dto';
import { KpiService } from './kpi.service';

@ApiTags('kpis')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('kpis')
export class KpiController {
  constructor(private readonly kpi: KpiService) {}

  @Get('latest')
  @ApiOperation({ summary: 'Return latest PUE/WUE and other KPIs.' })
  @ApiOkResponse({ type: KpiLatestResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  latest() { return this.kpi.latest(); }

  @Get('timeseries')
  @ApiOperation({ summary: 'Return KPI trend.' })
  @ApiOkResponse({ type: KpiTimeseriesResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  timeseries(@Query() query: KpiTimeseriesQueryDto) { return this.kpi.timeseries(query); }
}
