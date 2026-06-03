export interface KpiDefinitionRow {
  kpi_id: string;
  code: string;
  name: string;
  unit_code: string;
  target_value: number | null;
}

export interface KpiSampleRow {
  time: Date;
  kpi_id: string;
  value: number;
}

export interface KpiLatestItem {
  kpiId: string;
  code: string;
  name: string;
  value: number;
  unit: string;
  targetValue: number | null;
  timestamp: string;
}

export interface KpiLatestResponse {
  items: KpiLatestItem[];
}

export interface KpiTimeseriesPoint {
  timestamp: string;
  value: number;
}

export interface KpiTimeseriesItem {
  kpiId: string;
  code: string;
  points: KpiTimeseriesPoint[];
}

export interface KpiTimeseriesResponse {
  items: KpiTimeseriesItem[];
}
