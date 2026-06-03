export interface CapacitySnapshotRow {
  zone_id: string;
  power_total_kw: number;
  power_used_kw: number;
  power_available_kw: number;
  cooling_total_kw: number;
  cooling_used_kw: number;
  cooling_available_kw: number;
  space_total_u: number;
  space_used_u: number;
  space_available_u: number;
}

export interface CapacitySummaryItem {
  zoneId: string;
  powerTotal: number;
  powerUsed: number;
  powerAvailable: number;
  coolingTotal: number;
  coolingUsed: number;
  coolingAvailable: number;
  spaceTotal: number;
  spaceUsed: number;
  spaceAvailable: number;
}

export interface CapacitySummaryResponse {
  items: CapacitySummaryItem[];
}

export interface PlacementRecommendationRow {
  recommendation_id: string;
}

export interface PlacementScoreDetailRow {
  rack_pos_id: string;
  total_score: number;
  reasoning_text: string | null;
}

export interface PlacementItem {
  rackPositionId: string;
  score: number;
  reasons: string[];
}

export interface PlacementRecommendationResponse {
  recommendationId: string;
  items: PlacementItem[];
}
