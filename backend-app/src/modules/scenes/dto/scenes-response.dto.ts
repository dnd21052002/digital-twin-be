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
