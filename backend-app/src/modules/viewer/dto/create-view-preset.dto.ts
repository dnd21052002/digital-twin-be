import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class Point3dDto {
  @ApiProperty({ example: 10.5 })
  @IsNumber()
  x!: number;

  @ApiProperty({ example: 20.3 })
  @IsNumber()
  y!: number;

  @ApiProperty({ example: 5.0 })
  @IsNumber()
  z!: number;
}

export class CreateViewPresetDto {
  @ApiProperty({ example: 'My View' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ type: Point3dDto })
  @IsObject()
  position!: Point3dDto;

  @ApiProperty({ type: Point3dDto })
  @IsObject()
  target!: Point3dDto;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(180)
  fov?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sceneId?: string;
}
