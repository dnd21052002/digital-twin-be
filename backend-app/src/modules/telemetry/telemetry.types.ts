export interface LatestMetric {
  metricKey: string;
  name: string;
  unit: string;
  value: number;
  quality: number;
  timestamp: string;
}

export interface LatestMetricsResponse {
  assetId: string;
  items: LatestMetric[];
}

export interface MetricTimeseriesPoint {
  timestamp: string;
  value: number;
  quality: number | null;
}

export interface MetricTimeseriesResponse {
  assetId: string;
  metricKey: string;
  unit: string | null;
  from: string;
  to: string;
  interval: string | null;
  points: MetricTimeseriesPoint[];
}
