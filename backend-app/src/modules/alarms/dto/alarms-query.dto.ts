import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

const ALARM_STATES = ['new', 'acked', 'assigned', 'in_progress', 'resolved', 'closed', 'auto_cleared', 'suppressed'] as const;
const ALARM_SEVERITIES = ['info', 'warning', 'error', 'critical'] as const;

export class AlarmsQueryDto {
  @ApiPropertyOptional({ enum: ALARM_STATES, example: 'new' })
  @IsOptional()
  @IsIn(ALARM_STATES)
  status?: string;

  @ApiPropertyOptional({ enum: ALARM_SEVERITIES, example: 'critical' })
  @IsOptional()
  @IsIn(ALARM_SEVERITIES)
  severity?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assetId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @ApiPropertyOptional({ format: 'date-time', description: 'Use nextCursor from the previous page.' })
  @IsOptional()
  @IsDateString()
  cursor?: string;
}

export class AlarmIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  alarmId!: string;
}

// ── Action DTOs ──

export class AcknowledgeAlarmDto {
  @ApiPropertyOptional({ description: 'Optional acknowledge comment' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class AssignAlarmDto {
  @ApiProperty({ format: 'uuid', description: 'User ID to assign the alarm to' })
  @IsUUID()
  assigneeUserId!: string;
}

export class ResolveAlarmDto {
  @ApiProperty({ description: 'Resolution note' })
  @IsString()
  resolution!: string;
}
