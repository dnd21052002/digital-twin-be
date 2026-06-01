import { ApiProperty } from '@nestjs/swagger';

export class LatestMetricDto {
  @ApiProperty({ example: 'temperature' }) metricKey!: string;
  @ApiProperty({ example: 'Temperature' }) name!: string;
  @ApiProperty({ example: 'C' }) unit!: string;
  @ApiProperty({ example: 25.5 }) value!: number;
  @ApiProperty({ example: 0 }) quality!: number;
  @ApiProperty({ format: 'date-time' }) timestamp!: string;
}

export class LatestMetricsResponseDto {
  @ApiProperty({ format: 'uuid' }) assetId!: string;
  @ApiProperty({ type: [LatestMetricDto] }) items!: LatestMetricDto[];
}

export class MetricTimeseriesPointDto {
  @ApiProperty({ format: 'date-time' }) timestamp!: string;
  @ApiProperty({ example: 25.5 }) value!: number;
  @ApiProperty({ example: 0, nullable: true }) quality!: number | null;
}

export class MetricTimeseriesResponseDto {
  @ApiProperty({ format: 'uuid' }) assetId!: string;
  @ApiProperty({ example: 'temperature' }) metricKey!: string;
  @ApiProperty({ example: 'C', nullable: true }) unit!: string | null;
  @ApiProperty({ format: 'date-time' }) from!: string;
  @ApiProperty({ format: 'date-time' }) to!: string;
  @ApiProperty({ example: null, nullable: true }) interval!: string | null;
  @ApiProperty({ type: [MetricTimeseriesPointDto] }) points!: MetricTimeseriesPointDto[];
}
