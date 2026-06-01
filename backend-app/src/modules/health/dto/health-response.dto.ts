import { ApiProperty } from '@nestjs/swagger';

export class AppHealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'twin-backend' })
  service!: string;

  @ApiProperty({ example: '0.1.0' })
  version!: string;
}

export class DbHealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: string;

  @ApiProperty({ example: 'twin_db' })
  database!: string;

  @ApiProperty({ example: 'twin' })
  user!: string;

  @ApiProperty({ example: ['postgis', 'postgis_topology', 'timescaledb'], type: [String] })
  extensions!: string[];

  @ApiProperty({ example: 12 })
  hypertables!: number;
}
