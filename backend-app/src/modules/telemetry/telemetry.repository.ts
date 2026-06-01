import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DbService } from '../../db/db.service';
import { AssetMetricsQueryDto } from './dto/metrics-query.dto';

export interface LatestMetricRow {
  asset_id: string;
  metric_key: string;
  name: string;
  unit: string;
  timestamp: Date | string;
  value: number | string;
  quality: number | string;
}

export interface TimeseriesMetricRow {
  timestamp: Date | string;
  value: number | string;
  quality: number | string | null;
  unit: string | null;
}

@Injectable()
export class TelemetryRepository {
  constructor(private readonly dbService: DbService) {}
  private get db() { return this.dbService.db; }

  async assetExists(assetId: string): Promise<boolean> {
    const result = await sql<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1
        FROM asset.asset
        WHERE asset_id = ${assetId} AND deleted_at IS NULL
      ) AS exists
    `.execute(this.db);
    return result.rows[0]?.exists ?? false;
  }

  async latestMetrics(assetId: string): Promise<LatestMetricRow[]> {
    const result = await sql<LatestMetricRow>`
      SELECT DISTINCT ON (ms.asset_id, md.code)
        ms.asset_id::text AS asset_id,
        md.code AS metric_key,
        md.name,
        md.unit_code AS unit,
        ms.time AS timestamp,
        ms.value,
        ms.quality
      FROM telemetry.metric_sample ms
      JOIN telemetry.metric_definition md ON md.metric_id = ms.metric_id
      WHERE ms.asset_id = ${assetId}
      ORDER BY ms.asset_id, md.code, ms.time DESC
    `.execute(this.db);
    return result.rows;
  }

  async metricTimeseries(assetId: string, query: AssetMetricsQueryDto): Promise<TimeseriesMetricRow[]> {
    const result = await sql<TimeseriesMetricRow>`
      SELECT
        ms.time AS timestamp,
        ms.value,
        ms.quality,
        md.unit_code AS unit
      FROM telemetry.metric_sample ms
      JOIN telemetry.metric_definition md ON md.metric_id = ms.metric_id
      WHERE ms.asset_id = ${assetId}
        AND md.code = ${query.metric}
        AND ms.time >= ${query.from}::timestamptz
        AND ms.time <= ${query.to}::timestamptz
      ORDER BY ms.time ASC
      LIMIT ${query.limit}
    `.execute(this.db);
    return result.rows;
  }
}
