export interface RackPositionNode { id: string; code: string; positionIndex: number; maxU: number | null; maxPowerKw: number | null; currentRackId: string | null; }
export interface RowNode { id: string; code: string; orientationDeg: number | null; rackPositions: RackPositionNode[]; }
export interface ZoneNode { id: string; code: string; name: string; zoneType: string; rows: RowNode[]; }
export interface HallNode { id: string; code: string; name: string; areaM2: number | null; zones: ZoneNode[]; rows: RowNode[]; }
export interface FloorNode { id: string; code: string; name: string; level: number; halls: HallNode[]; }
export interface BuildingNode { id: string; code: string; name: string; floorCount: number | null; floors: FloorNode[]; }
export interface SiteNode { id: string; code: string; name: string; timezone: string | null; buildings: BuildingNode[]; }
export interface FacilityTreeResponse { sites: SiteNode[]; }

export interface RackPositionLocationSummary { siteId: string; buildingId: string; floorId: string; hallId: string; zoneId: string | null; rowId: string; }
export interface RackPositionSummary { id: string; code: string; positionIndex: number; maxU: number | null; maxPowerKw: number | null; currentRackId: string | null; location: RackPositionLocationSummary; }
export interface RackPositionsResponse { items: RackPositionSummary[]; nextCursor: string | null; }
