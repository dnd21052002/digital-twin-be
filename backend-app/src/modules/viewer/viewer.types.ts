export interface ViewpointSummary {
  id: string;
  sceneId: string;
  name: string;
  type: string;
  target: Record<string, unknown>;
  camera: Record<string, unknown>;
  sortOrder: number | null;
}

export interface ViewpointsResponse {
  items: ViewpointSummary[];
}

export interface ViewpointRow {
  id: string;
  scene_id: string;
  name: string;
  type: string;
  target: unknown;
  camera: unknown;
  sort_order: number | string | null;
}
