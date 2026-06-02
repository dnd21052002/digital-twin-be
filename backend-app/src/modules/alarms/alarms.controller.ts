import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiErrorResponseDto, OkResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { AlarmsService } from './alarms.service';
import { AcknowledgeAlarmDto, AlarmIdParamDto, AlarmsQueryDto, AssignAlarmDto, ResolveAlarmDto } from './dto/alarms-query.dto';
import { AlarmDetailDto, AlarmListResponseDto, NearestCamerasResponseDto, SopResponseDto } from './dto/alarms-response.dto';

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

@ApiTags('alarms')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('alarm:write')
@Controller('alarms')
export class AlarmsActionController {
  constructor(private readonly alarms: AlarmsService) {}

  @Post(':alarmId/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alarm.' })
  @ApiBody({ type: AcknowledgeAlarmDto })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  acknowledgeAlarm(@Param() params: AlarmIdParamDto, @Body() dto: AcknowledgeAlarmDto, @Req() req: Request) {
    return this.alarms.acknowledgeAlarm(params.alarmId, dto.comment, req);
  }

  @Post(':alarmId/assign')
  @ApiOperation({ summary: 'Assign an alarm to a user.' })
  @ApiBody({ type: AssignAlarmDto })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  assignAlarm(@Param() params: AlarmIdParamDto, @Body() dto: AssignAlarmDto, @Req() req: Request) {
    return this.alarms.assignAlarm(params.alarmId, dto.assigneeUserId, req);
  }

  @Post(':alarmId/resolve')
  @ApiOperation({ summary: 'Resolve an alarm with a resolution note.' })
  @ApiBody({ type: ResolveAlarmDto })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  resolveAlarm(@Param() params: AlarmIdParamDto, @Body() dto: ResolveAlarmDto, @Req() req: Request) {
    return this.alarms.resolveAlarm(params.alarmId, dto.resolution, req);
  }
}

@ApiTags('alarms')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('alarms')
export class AlarmsCameraController {
  constructor(private readonly alarms: AlarmsService) {}

  @Get(':alarmId/nearest-cameras')
  @ApiOperation({ summary: 'Get nearest CCTV cameras for the alarm asset zone.' })
  @ApiOkResponse({ type: NearestCamerasResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  getNearestCameras(@Param() params: AlarmIdParamDto) {
    return this.alarms.getNearestCameras(params.alarmId);
  }
}

@ApiTags('alarms')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('alarm:read')
@Controller('alarms')
export class AlarmsSopController {
  constructor(private readonly alarms: AlarmsService) {}

  @Get(':alarmId/sop')
  @ApiOperation({ summary: 'Get SOP document and steps for the alarm rule.' })
  @ApiOkResponse({ type: SopResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  getSop(@Param() params: AlarmIdParamDto) {
    return this.alarms.getSop(params.alarmId);
  }
}
