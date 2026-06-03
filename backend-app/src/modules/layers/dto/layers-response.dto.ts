import { ApiProperty } from '@nestjs/swagger';

export class LayerTypeSummaryDto {
  @ApiProperty() id!: number;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() defaultOpacity!: number;
  @ApiProperty() dataSourceKind!: string;
}

export class LayerTypesResponseDto {
  @ApiProperty({ type: [LayerTypeSummaryDto] }) items!: LayerTypeSummaryDto[];
}

export class LayerInstanceSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) sceneId!: string;
  @ApiProperty() layerTypeId!: number;
  @ApiProperty() name!: string;
  @ApiProperty() isEnabledDefault!: boolean;
  @ApiProperty() defaultOpacity!: number;
  @ApiProperty({ type: Object }) config!: Record<string, unknown>;
}

export class LayerInstancesResponseDto {
  @ApiProperty({ type: [LayerInstanceSummaryDto] }) items!: LayerInstanceSummaryDto[];
}

export class ThermalGridCellDto {
  @ApiProperty() cellId!: number;
  @ApiProperty() gridX!: number;
  @ApiProperty() gridY!: number;
  @ApiProperty() gridZ!: number;
  @ApiProperty({ nullable: true }) value!: number | null;
  @ApiProperty({ nullable: true }) unit!: string | null;
}

export class ThermalGridResponseDto {
  @ApiProperty({ type: [ThermalGridCellDto] }) grid!: ThermalGridCellDto[];
}

export class AirflowVectorDto {
  @ApiProperty() vectorId!: number;
  @ApiProperty({ type: [Number] }) origin!: [number, number, number];
  @ApiProperty({ type: [Number] }) direction!: [number, number, number];
  @ApiProperty() magnitude!: number;
  @ApiProperty() measuredAt!: string;
}

export class AirflowResponseDto {
  @ApiProperty({ type: [AirflowVectorDto] }) vectors!: AirflowVectorDto[];
}

export class PowerPathSummaryDto {
  @ApiProperty() pathId!: number;
  @ApiProperty({ format: 'uuid' }) fromAssetId!: string;
  @ApiProperty({ format: 'uuid' }) toAssetId!: string;
  @ApiProperty({ nullable: true }) connectionType!: string | null;
  @ApiProperty({ nullable: true }) pathGeom!: unknown;
}

export class PowerPathsResponseDto {
  @ApiProperty({ type: [PowerPathSummaryDto] }) paths!: PowerPathSummaryDto[];
}
