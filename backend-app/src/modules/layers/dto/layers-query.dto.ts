import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class LayerInstancesQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sceneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;
}

export class ThermalQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sceneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  at?: string;

  @ApiPropertyOptional({ description: 'Grid resolution e.g. "12x4"' })
  @IsOptional()
  @IsString()
  grid?: string;
}

export class AirflowQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sceneId?: string;
}

export class PowerPathsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sceneId?: string;
}

export class UserLayerStateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  layerInstanceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  layerType?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sceneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  visible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  opacity?: number;
}

export class UserLayerStateQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sceneId?: string;
}
