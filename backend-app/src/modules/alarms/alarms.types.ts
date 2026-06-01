export interface AlarmAssetSummary {
  id: string;
  assetTag: string;
  name: string;
  category: string;
}

export interface AlarmSummary {
  id: string;
  raisedAt: string;
  severity: string;
  state: string;
  title: string;
  message: string | null;
  currentValue: number | null;
  thresholdValue: number | null;
  asset: AlarmAssetSummary | null;
}

export interface AlarmListResponse {
  items: AlarmSummary[];
  nextCursor: string | null;
}

export interface AlarmTimelineEvent {
  id: string;
  occurredAt: string;
  actorId: string | null;
  eventType: string;
  payload: unknown;
}

export interface AlarmDetail extends AlarmSummary {
  rule: { id: string; code: string; name: string } | null;
  forecastValue: number | null;
  forecastHorizonMin: number | null;
  ackedBy: string | null;
  ackedAt: string | null;
  assignedTo: string | null;
  assignedAt: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  location: unknown | null;
  nearestCamera: AlarmAssetSummary | null;
  sop: { id: string; code: string; title: string; version: string } | null;
  attributes: unknown;
  timeline: AlarmTimelineEvent[];
}
