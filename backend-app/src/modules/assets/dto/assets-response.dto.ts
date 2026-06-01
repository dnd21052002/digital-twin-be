import { ApiProperty } from '@nestjs/swagger';

export class AssetLocationSummaryDto {
  @ApiProperty({ format: 'uuid', nullable: true }) siteId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) buildingId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) floorId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) hallId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) zoneId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) rowId!: string | null;
  @ApiProperty({ format: 'uuid', nullable: true }) rackPositionId!: string | null;
}

export class AssetSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'RACK-A01' }) assetTag!: string;
  @ApiProperty({ example: 'Rack A01' }) name!: string;
  @ApiProperty({ example: 'rack' }) category!: string;
  @ApiProperty({ example: 'online' }) status!: string;
  @ApiProperty({ type: AssetLocationSummaryDto }) location!: AssetLocationSummaryDto;
}

export class AssetListResponseDto {
  @ApiProperty({ type: [AssetSummaryDto] }) items!: AssetSummaryDto[];
  @ApiProperty({ nullable: true }) nextCursor!: string | null;
}

export class AssetLocationNodeDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
}

export class AssetModelDto {
  @ApiProperty() id!: string;
  @ApiProperty({ nullable: true }) manufacturer!: string | null;
  @ApiProperty({ nullable: true }) modelCode!: string | null;
  @ApiProperty({ nullable: true }) displayName!: string | null;
  @ApiProperty({ nullable: true }) defaultPowerKw!: number | null;
  @ApiProperty({ nullable: true }) defaultCoolingKw!: number | null;
  @ApiProperty({ nullable: true }) rackUnits!: number | null;
  @ApiProperty({ nullable: true }) weightKg!: number | null;
  @ApiProperty({ nullable: true }) meshId!: string | null;
  @ApiProperty({ nullable: true }) spec!: unknown;
}

export class AssetDetailLocationDto {
  @ApiProperty({ type: AssetLocationNodeDto, nullable: true }) site!: AssetLocationNodeDto | null;
  @ApiProperty({ type: AssetLocationNodeDto, nullable: true }) building!: AssetLocationNodeDto | null;
  @ApiProperty({ type: AssetLocationNodeDto, nullable: true }) floor!: AssetLocationNodeDto | null;
  @ApiProperty({ type: AssetLocationNodeDto, nullable: true }) hall!: AssetLocationNodeDto | null;
  @ApiProperty({ type: AssetLocationNodeDto, nullable: true }) zone!: AssetLocationNodeDto | null;
  @ApiProperty({ type: AssetLocationNodeDto, nullable: true }) row!: AssetLocationNodeDto | null;
  @ApiProperty({ type: AssetLocationNodeDto, nullable: true }) rackPosition!: AssetLocationNodeDto | null;
}

export class AssetGeometryDto {
  @ApiProperty({ nullable: true }) rotationDeg!: number | null;
  @ApiProperty({ nullable: true }) coordinates!: unknown | null;
}

export class AssetDetailDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() assetTag!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ example: { code: 'rack', name: 'Rack' } }) category!: { code: string; name: string | null };
  @ApiProperty({ type: AssetModelDto, nullable: true }) model!: AssetModelDto | null;
  @ApiProperty({ nullable: true }) serialNo!: string | null;
  @ApiProperty() status!: string;
  @ApiProperty({ type: AssetDetailLocationDto }) location!: AssetDetailLocationDto;
  @ApiProperty({ type: AssetGeometryDto }) geometry!: AssetGeometryDto;
  @ApiProperty() attributes!: unknown;
}
