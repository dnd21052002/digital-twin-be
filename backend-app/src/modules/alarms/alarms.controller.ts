import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { AlarmsService } from './alarms.service';
import { AlarmIdParamDto, AlarmsQueryDto } from './dto/alarms-query.dto';
import { AlarmDetailDto, AlarmListResponseDto } from './dto/alarms-response.dto';

@ApiTags('alarms')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('alarm:read')
@Controller('alarms')
export class AlarmsController {
  constructor(private readonly alarms: AlarmsService) {}

  @Get()
  @ApiOperation({ summary: 'List alarms with optional filters.' })
  @ApiOkResponse({ type: AlarmListResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  listAlarms(@Query() query: AlarmsQueryDto) { return this.alarms.listAlarms(query); }

  @Get(':alarmId')
  @ApiOperation({ summary: 'Get alarm detail with asset, rule, SOP/camera hints, and timeline.' })
  @ApiOkResponse({ type: AlarmDetailDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  getAlarm(@Param() params: AlarmIdParamDto) { return this.alarms.getAlarm(params.alarmId); }
}
