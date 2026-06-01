import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AssetMetricsQueryDto } from './dto/metrics-query.dto';
import { LatestMetricRow, TelemetryRepository, TimeseriesMetricRow } from './telemetry.repository';
import { LatestMetricsResponse, MetricTimeseriesResponse } from './telemetry.types';

@Injectable()
export class TelemetryService {
  constructor(private readonly repository: TelemetryRepository) {}

  async latestMetrics(assetId: string): Promise<LatestMetricsResponse> {
    await this.ensureAssetExists(assetId);
    const rows = await this.repository.latestMetrics(assetId);
    return { assetId, items: rows.map(toLatestMetric) };
  }

  async metricTimeseries(assetId: string, query: AssetMetricsQueryDto): Promise<MetricTimeseriesResponse> {
    await this.ensureAssetExists(assetId);
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (from > to) throw new BadRequestException('from must be before or equal to to');

    const rows = await this.repository.metricTimeseries(assetId, query);
    return {
      assetId,
      metricKey: query.metric,
      unit: rows[0]?.unit ?? null,
      from: from.toISOString(),
      to: to.toISOString(),
      interval: query.interval ?? null,
      points: rows.map(toTimeseriesPoint),
    };
  }

  private async ensureAssetExists(assetId: string): Promise<void> {
    if (!(await this.repository.assetExists(assetId))) throw new NotFoundException('Asset not found');
  }
}

function toLatestMetric(row: LatestMetricRow) {
  return {
    metricKey: row.metric_key,
    name: row.name,
    unit: row.unit,
    value: Number(row.value),
    quality: Number(row.quality),
    timestamp: new Date(row.timestamp).toISOString(),
  };
}

function toTimeseriesPoint(row: TimeseriesMetricRow) {
  return {
    timestamp: new Date(row.timestamp).toISOString(),
    value: Number(row.value),
    quality: row.quality === null ? null : Number(row.quality),
  };
}
