import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

const ALARM_STATES = ['new', 'acked', 'assigned', 'in_progress', 'resolved', 'closed', 'auto_cleared', 'suppressed'] as const;
const ALARM_SEVERITIES = ['info', 'warning', 'error', 'critical'] as const;

export class AlarmsQueryDto {
  @IsOptional()
  @IsIn(ALARM_STATES)
  status?: string;

  @IsOptional()
  @IsIn(ALARM_SEVERITIES)
  severity?: string;

  @IsOptional()
  @IsUUID()
  assetId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @IsOptional()
  @IsDateString()
  cursor?: string;
}

export class AlarmIdParamDto {
  @IsUUID()
  alarmId!: string;
}
