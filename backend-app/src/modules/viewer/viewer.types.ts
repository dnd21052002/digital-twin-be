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

export interface ViewPresetRow {
  preset_id: string;
  name: string;
  user_id: string;
  scene_id: string | null;
  created_at: Date;
}

export interface ViewPresetResponse {
  id: string;
  name: string;
  userId: string;
  sceneId: string | null;
  createdAt: string;
}
