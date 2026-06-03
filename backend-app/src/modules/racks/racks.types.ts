export interface RackLocationNode {
  id: string;
  name: string;
}

export interface RackModel {
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
}

export interface RackDetail {
  id: string;
  assetTag: string;
  name: string;
  category: { code: string; name: string | null };
  model: RackModel | null;
  serialNo: string | null;
  status: string;
  location: {
    site: RackLocationNode | null;
    building: RackLocationNode | null;
    floor: RackLocationNode | null;
    hall: RackLocationNode | null;
    zone: RackLocationNode | null;
    row: RackLocationNode | null;
    rackPosition: RackLocationNode | null;
  };
  capacity: {
    maxU: number | null;
    usedU: number | null;
    maxPowerKw: number | null;
    usedPowerKw: number | null;
  };
  units: unknown[];
  containedAssets: unknown[];
  activeAlarmSummary: unknown | null;
}
