import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { AlarmsService } from './alarms.service';
import { AlarmIdParamDto, AlarmsQueryDto } from './dto/alarms-query.dto';

@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('alarm:read')
@Controller('alarms')
export class AlarmsController {
  constructor(private readonly alarms: AlarmsService) {}

  @Get()
  listAlarms(@Query() query: AlarmsQueryDto) {
    return this.alarms.listAlarms(query);
  }

  @Get(':alarmId')
  getAlarm(@Param() params: AlarmIdParamDto) {
    return this.alarms.getAlarm(params.alarmId);
  }
}
