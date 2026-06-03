import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class KpiTimeseriesQueryDto {
  @ApiProperty({ format: 'date-time', example: '2026-06-01T00:00:00Z' })
  @IsISO8601({ strict: true })
  from!: string;

  @ApiProperty({ format: 'date-time', example: '2026-06-01T01:00:00Z' })
  @IsISO8601({ strict: true })
  to!: string;

  @ApiProperty({ example: '1h', required: false })
  @IsOptional()
  @IsString()
  interval?: string;
}
