import { Transform } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AssetMetricsQueryDto {
  @IsString()
  metric!: string;

  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsOptional()
  @IsString()
  interval?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(5000)
  limit = 1000;
}

export class AssetIdParamDto {
  @IsUUID()
  assetId!: string;
}
