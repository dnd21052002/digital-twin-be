export interface LayerTypeRow {
  layer_type_id: number;
  code: string;
  name: string;
  default_opacity: number | string;
  data_source_kind: string;
}

export interface LayerTypeSummary {
  id: number;
  code: string;
  name: string;
  defaultOpacity: number;
  dataSourceKind: string;
}

export interface LayerTypesResponse {
  items: LayerTypeSummary[];
}

export interface LayerInstanceRow {
  layer_instance_id: string;
  scene_id: string;
  layer_type_id: number;
  name: string;
  is_enabled_default: boolean;
  default_opacity: number | string;
  config: unknown;
}

export interface LayerInstanceSummary {
  id: string;
  sceneId: string;
  layerTypeId: number;
  name: string;
  isEnabledDefault: boolean;
  defaultOpacity: number;
  config: Record<string, unknown>;
}

export interface LayerInstancesResponse {
  items: LayerInstanceSummary[];
}

export interface ThermalGridRow {
  cell_id: number;
  grid_x: number;
  grid_y: number;
  grid_z: number;
  value: number | string | null;
  unit: string | null;
}

export interface ThermalGridCell {
  cellId: number;
  gridX: number;
  gridY: number;
  gridZ: number;
  value: number | null;
  unit: string | null;
}

export interface ThermalGridResponse {
  grid: ThermalGridCell[];
}

export interface AirflowRow {
  vector_id: number;
  origin_x: number | string;
  origin_y: number | string;
  origin_z: number | string;
  direction_x: number | string;
  direction_y: number | string;
  direction_z: number | string;
  magnitude_m_s: number | string;
  measured_at: Date | string;
}

export interface AirflowVector {
  vectorId: number;
  origin: [number, number, number];
  direction: [number, number, number];
  magnitude: number;
  measuredAt: string;
}

export interface AirflowResponse {
  vectors: AirflowVector[];
}

export interface PowerPathRow {
  path_id: number;
  from_asset_id: string;
  to_asset_id: string;
  connection_type: string | null;
  path_geom: unknown;
}

export interface PowerPathSummary {
  pathId: number;
  fromAssetId: string;
  toAssetId: string;
  connectionType: string | null;
  pathGeom: unknown;
}

export interface PowerPathsResponse {
  paths: PowerPathSummary[];
}

export interface UserLayerStateRow {
  user_id: string;
  layer_instance_id: string;
  is_enabled: boolean;
  opacity: number | string;
}
