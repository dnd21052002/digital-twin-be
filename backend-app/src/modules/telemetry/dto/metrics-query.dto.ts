import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AssetMetricsQueryDto {
  @ApiProperty({ example: 'temperature' })
  @IsString()
  metric!: string;

  @ApiProperty({ format: 'date-time', example: '2026-06-01T00:00:00.000Z' })
  @IsDateString()
  from!: string;

  @ApiProperty({ format: 'date-time', example: '2026-06-01T01:00:00.000Z' })
  @IsDateString()
  to!: string;

  @ApiPropertyOptional({ example: '1m', description: 'Reserved for downsampling; currently returned as metadata.' })
  @IsOptional()
  @IsString()
  interval?: string;

  @ApiPropertyOptional({ default: 1000, minimum: 1, maximum: 5000 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(5000)
  limit = 1000;
}

export class AssetIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assetId!: string;
}
