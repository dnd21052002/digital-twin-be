import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DbService } from '../../db/db.service';
import { KpiTimeseriesQueryDto } from './dto/kpi-query.dto';
import { KpiDefinitionRow, KpiSampleRow } from './kpi.types';

@Injectable()
export class KpiRepository {
  constructor(private readonly dbService: DbService) {}
  private get db() { return this.dbService.db; }

  async listDefinitions(): Promise<KpiDefinitionRow[]> {
    const r = await sql<KpiDefinitionRow>`
      SELECT kpi_id::text AS kpi_id, code, name, unit_code, target_value
      FROM kpi.kpi_definition
      ORDER BY display_order ASC, code ASC
    `.execute(this.db);
    return r.rows;
  }

  async latestSamplePerKpi(): Promise<KpiSampleRow[]> {
    const r = await sql<KpiSampleRow>`
      SELECT DISTINCT ON (kpi_id)
        time, kpi_id::text AS kpi_id, value
      FROM kpi.kpi_sample
      ORDER BY kpi_id, time DESC
    `.execute(this.db);
    return r.rows;
  }

  async timeseries(query: KpiTimeseriesQueryDto): Promise<KpiSampleRow[]> {
    const interval = query.interval ?? '1h';
    const r = await sql<KpiSampleRow>`
      SELECT
        time_bucket(${interval}::interval, time) AS time,
        kpi_id::text AS kpi_id,
        AVG(value) AS value
      FROM kpi.kpi_sample
      WHERE time >= ${query.from}::timestamptz
        AND time < ${query.to}::timestamptz
      GROUP BY time_bucket(${interval}::interval, time), kpi_id
      ORDER BY kpi_id, time ASC
    `.execute(this.db);
    return r.rows;
  }
}
