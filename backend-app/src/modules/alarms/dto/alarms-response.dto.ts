import { ApiProperty } from '@nestjs/swagger';

export class AlarmAssetSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() assetTag!: string;
  @ApiProperty() name!: string;
  @ApiProperty() category!: string;
}

export class AlarmSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'date-time' }) raisedAt!: string;
  @ApiProperty({ enum: ['info', 'warning', 'error', 'critical'] }) severity!: string;
  @ApiProperty({ enum: ['new', 'acked', 'assigned', 'in_progress', 'resolved', 'closed', 'auto_cleared', 'suppressed'] }) state!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) message!: string | null;
  @ApiProperty({ nullable: true }) currentValue!: number | null;
  @ApiProperty({ nullable: true }) thresholdValue!: number | null;
  @ApiProperty({ type: AlarmAssetSummaryDto, nullable: true }) asset!: AlarmAssetSummaryDto | null;
}

export class AlarmListResponseDto {
  @ApiProperty({ type: [AlarmSummaryDto] }) items!: AlarmSummaryDto[];
  @ApiProperty({ format: 'date-time', nullable: true }) nextCursor!: string | null;
}

export class AlarmRuleSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
}

export class AlarmSopSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() title!: string;
  @ApiProperty() version!: string;
}

export class AlarmTimelineEventDto {
  @ApiProperty() id!: string;
  @ApiProperty({ format: 'date-time' }) occurredAt!: string;
  @ApiProperty({ format: 'uuid', nullable: true }) actorId!: string | null;
  @ApiProperty() eventType!: string;
  @ApiProperty() payload!: unknown;
}

export class AlarmDetailDto extends AlarmSummaryDto {
  @ApiProperty({ type: AlarmRuleSummaryDto, nullable: true }) rule!: AlarmRuleSummaryDto | null;
  @ApiProperty({ nullable: true }) forecastValue!: number | null;
  @ApiProperty({ nullable: true }) forecastHorizonMin!: number | null;
  @ApiProperty({ format: 'uuid', nullable: true }) ackedBy!: string | null;
  @ApiProperty({ format: 'date-time', nullable: true }) ackedAt!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) assignedTo!: string | null;
  @ApiProperty({ format: 'date-time', nullable: true }) assignedAt!: string | null;
  @ApiProperty({ format: 'date-time', nullable: true }) resolvedAt!: string | null;
  @ApiProperty({ nullable: true }) resolutionNote!: string | null;
  @ApiProperty({ nullable: true }) location!: unknown | null;
  @ApiProperty({ type: AlarmAssetSummaryDto, nullable: true }) nearestCamera!: AlarmAssetSummaryDto | null;
  @ApiProperty({ type: AlarmSopSummaryDto, nullable: true }) sop!: AlarmSopSummaryDto | null;
  @ApiProperty() attributes!: unknown;
  @ApiProperty({ type: [AlarmTimelineEventDto] }) timeline!: AlarmTimelineEventDto[];
}
