import { ApiProperty } from '@nestjs/swagger';

export class ViewpointSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) sceneId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() type!: string;
  @ApiProperty({ type: Object }) target!: Record<string, unknown>;
  @ApiProperty({ type: Object }) camera!: Record<string, unknown>;
  @ApiProperty({ nullable: true }) sortOrder!: number | null;
}

export class ViewpointsResponseDto {
  @ApiProperty({ type: [ViewpointSummaryDto] }) items!: ViewpointSummaryDto[];
}
