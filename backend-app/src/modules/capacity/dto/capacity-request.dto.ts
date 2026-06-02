import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PlacementRecommendationRequestDto {
  @ApiProperty()
  @IsString()
  siteId!: string;

  @ApiProperty({ example: 8.5 })
  @IsNumber()
  @Min(0)
  requiredKw!: number;

  @ApiProperty({ example: 9.2 })
  @IsNumber()
  @Min(0)
  requiredCoolingKw!: number;

  @ApiProperty({ example: 42 })
  @IsNumber()
  @Min(1)
  rackUnits!: number;

  @ApiProperty({ example: 'N+1', required: false })
  @IsOptional()
  @IsString()
  redundancy?: string;
}
