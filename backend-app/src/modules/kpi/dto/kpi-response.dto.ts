import { ApiProperty } from '@nestjs/swagger';

class KpiItemDto {
  @ApiProperty({ example: '1' })
  kpiId!: string;

  @ApiProperty({ example: 'PUE' })
  code!: string;

  @ApiProperty({ example: 'Power Usage Effectiveness' })
  name!: string;

  @ApiProperty({ example: 1.45 })
  value!: number;

  @ApiProperty({ example: 'ratio' })
  unit!: string;

  @ApiProperty({ example: 1.6, nullable: true })
  targetValue!: number | null;

  @ApiProperty({ format: 'date-time' })
  timestamp!: string;
}

export class KpiLatestResponseDto {
  @ApiProperty({ type: [KpiItemDto] })
  items!: KpiItemDto[];
}

class KpiTimeseriesPointDto {
  @ApiProperty({ format: 'date-time' })
  timestamp!: string;

  @ApiProperty()
  value!: number;
}

class KpiTimeseriesItemDto {
  @ApiProperty({ example: '1' })
  kpiId!: string;

  @ApiProperty({ example: 'PUE' })
  code!: string;

  @ApiProperty({ type: [KpiTimeseriesPointDto] })
  points!: KpiTimeseriesPointDto[];
}

export class KpiTimeseriesResponseDto {
  @ApiProperty({ type: [KpiTimeseriesItemDto] })
  items!: KpiTimeseriesItemDto[];
}
