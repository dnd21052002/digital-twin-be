import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RackIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  rackId!: string;
}

export class RackLocationNodeDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
}

export class RackModelDto {
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

export class RackDetailLocationDto {
  @ApiProperty({ type: RackLocationNodeDto, nullable: true }) site!: RackLocationNodeDto | null;
  @ApiProperty({ type: RackLocationNodeDto, nullable: true }) building!: RackLocationNodeDto | null;
  @ApiProperty({ type: RackLocationNodeDto, nullable: true }) floor!: RackLocationNodeDto | null;
  @ApiProperty({ type: RackLocationNodeDto, nullable: true }) hall!: RackLocationNodeDto | null;
  @ApiProperty({ type: RackLocationNodeDto, nullable: true }) zone!: RackLocationNodeDto | null;
  @ApiProperty({ type: RackLocationNodeDto, nullable: true }) row!: RackLocationNodeDto | null;
  @ApiProperty({ type: RackLocationNodeDto, nullable: true }) rackPosition!: RackLocationNodeDto | null;
}

export class RackCapacityDto {
  @ApiProperty({ nullable: true }) maxU!: number | null;
  @ApiProperty({ nullable: true }) usedU!: number | null;
  @ApiProperty({ nullable: true }) maxPowerKw!: number | null;
  @ApiProperty({ nullable: true }) usedPowerKw!: number | null;
}

export class RackDetailDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() assetTag!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ example: { code: 'rack', name: 'Rack' } }) category!: { code: string; name: string | null };
  @ApiProperty({ type: RackModelDto, nullable: true }) model!: RackModelDto | null;
  @ApiProperty({ nullable: true }) serialNo!: string | null;
  @ApiProperty() status!: string;
  @ApiProperty({ type: RackDetailLocationDto }) location!: RackDetailLocationDto;
  @ApiProperty({ type: RackCapacityDto }) capacity!: RackCapacityDto;
  @ApiProperty({ type: [Object] }) units!: unknown[];
  @ApiProperty({ type: [Object] }) containedAssets!: unknown[];
  @ApiProperty({ nullable: true }) activeAlarmSummary!: unknown | null;
}
