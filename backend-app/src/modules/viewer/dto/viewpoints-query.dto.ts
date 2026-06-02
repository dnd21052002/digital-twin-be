import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ViewpointsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sceneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;
}
