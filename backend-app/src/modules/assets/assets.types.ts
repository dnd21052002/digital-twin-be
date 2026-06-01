export interface AssetLocationSummary {
  siteId: string | null;
  buildingId: string | null;
  floorId: string | null;
  hallId: string | null;
  zoneId: string | null;
  rowId: string | null;
  rackPositionId: string | null;
}

export interface AssetSummary {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  status: string;
  location: AssetLocationSummary;
}

export interface AssetListResponse {
  items: AssetSummary[];
  nextCursor: string | null;
}

export interface AssetLocationNode {
  id: string;
  name: string;
}

export interface AssetDetail {
  id: string;
  assetTag: string;
  name: string;
  category: { code: string; name: string | null };
  model: {
    id: string;
    manufacturer: string | null;
    modelCode: string | null;
    displayName: string | null;
    defaultPowerKw: number | null;
    defaultCoolingKw: number | null;
    rackUnits: number | null;
    weightKg: number | null;
    meshId: string | null;
    spec: unknown;
  } | null;
  serialNo: string | null;
  status: string;
  location: {
    site: AssetLocationNode | null;
    building: AssetLocationNode | null;
    floor: AssetLocationNode | null;
    hall: AssetLocationNode | null;
    zone: AssetLocationNode | null;
    row: AssetLocationNode | null;
    rackPosition: AssetLocationNode | null;
  };
  geometry: {
    rotationDeg: number | null;
    coordinates: unknown | null;
  };
  attributes: unknown;
}
