import { ApiProperty } from '@nestjs/swagger';

export class RackPositionLocationDto {
  @ApiProperty({ format: 'uuid' }) siteId!: string;
  @ApiProperty({ format: 'uuid' }) buildingId!: string;
  @ApiProperty({ format: 'uuid' }) floorId!: string;
  @ApiProperty({ format: 'uuid' }) hallId!: string;
  @ApiProperty({ format: 'uuid', nullable: true }) zoneId!: string | null;
  @ApiProperty({ format: 'uuid' }) rowId!: string;
}

export class RackPositionSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'A01-RP01' }) code!: string;
  @ApiProperty() positionIndex!: number;
  @ApiProperty({ nullable: true }) maxU!: number | null;
  @ApiProperty({ nullable: true }) maxPowerKw!: number | null;
  @ApiProperty({ format: 'uuid', nullable: true }) currentRackId!: string | null;
  @ApiProperty({ type: RackPositionLocationDto }) location!: RackPositionLocationDto;
}

export class RackPositionsResponseDto {
  @ApiProperty({ type: [RackPositionSummaryDto] }) items!: RackPositionSummaryDto[];
  @ApiProperty({ nullable: true }) nextCursor!: string | null;
}
