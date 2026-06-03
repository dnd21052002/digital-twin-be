import { ApiProperty } from '@nestjs/swagger';

export class SceneSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() siteId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() isDefault!: boolean;
  @ApiProperty() lodStrategy!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class ScenesResponseDto {
  @ApiProperty({ type: [SceneSummaryDto] }) items!: SceneSummaryDto[];
}

export class SceneManifestDto {
  @ApiProperty({ type: SceneSummaryDto }) scene!: SceneSummaryDto;
  @ApiProperty({ type: [Object] }) meshes!: unknown[];
  @ApiProperty({ type: [Object] }) textures!: unknown[];
}

export class SceneAssetLocationDto {
  @ApiProperty({ nullable: true }) siteId!: string | null;
  @ApiProperty({ nullable: true }) buildingId!: string | null;
  @ApiProperty({ nullable: true }) floorId!: string | null;
  @ApiProperty({ nullable: true }) hallId!: string | null;
  @ApiProperty({ nullable: true }) zoneId!: string | null;
  @ApiProperty({ nullable: true }) rowId!: string | null;
  @ApiProperty({ nullable: true }) rackPositionId!: string | null;
}

export class SceneAssetGeometryDto {
  @ApiProperty({ nullable: true }) rotationDeg!: number | null;
  @ApiProperty({ nullable: true }) coordinates!: unknown | null;
}

export class SceneAssetSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() assetTag!: string;
  @ApiProperty() name!: string;
  @ApiProperty() category!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ type: SceneAssetLocationDto }) location!: SceneAssetLocationDto;
  @ApiProperty({ type: SceneAssetGeometryDto }) geometry!: SceneAssetGeometryDto;
}

export class SceneAssetsResponseDto {
  @ApiProperty({ type: [SceneAssetSummaryDto] }) items!: SceneAssetSummaryDto[];
  @ApiProperty({ nullable: true }) nextCursor!: string | null;
}
