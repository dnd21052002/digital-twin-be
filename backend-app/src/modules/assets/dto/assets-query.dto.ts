import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class AssetsQueryDto {
  limit?: number;
  cursor?: string;

  @ApiPropertyOptional({ description: 'Search by asset tag/name.' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'rack' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  siteId?: string;

  @ApiPropertyOptional({ example: 'online' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class AssetIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assetId!: string;
}
