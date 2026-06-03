import { ApiProperty } from '@nestjs/swagger';

class CapacitySummaryItemDto {
  @ApiProperty({ example: '1' })
  zoneId!: string;

  @ApiProperty({ example: 500.0 })
  powerTotal!: number;

  @ApiProperty({ example: 320.0 })
  powerUsed!: number;

  @ApiProperty({ example: 180.0 })
  powerAvailable!: number;

  @ApiProperty({ example: 400.0 })
  coolingTotal!: number;

  @ApiProperty({ example: 280.0 })
  coolingUsed!: number;

  @ApiProperty({ example: 120.0 })
  coolingAvailable!: number;

  @ApiProperty({ example: 420 })
  spaceTotal!: number;

  @ApiProperty({ example: 210 })
  spaceUsed!: number;

  @ApiProperty({ example: 210 })
  spaceAvailable!: number;
}

export class CapacitySummaryResponseDto {
  @ApiProperty({ type: [CapacitySummaryItemDto] })
  items!: CapacitySummaryItemDto[];
}

class PlacementItemDto {
  @ApiProperty({ example: '1' })
  rackPositionId!: string;

  @ApiProperty({ example: 92.4 })
  score!: number;

  @ApiProperty({ example: ['power_available', 'cooling_available'] })
  reasons!: string[];
}

export class PlacementRecommendationResponseDto {
  @ApiProperty({ format: 'uuid' })
  recommendationId!: string;

  @ApiProperty({ type: [PlacementItemDto] })
  items!: PlacementItemDto[];
}
