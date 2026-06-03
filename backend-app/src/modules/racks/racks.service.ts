import { Injectable, NotFoundException } from '@nestjs/common';
import { RackDetail } from './racks.types';
import { RackDetailRow, RacksRepository } from './racks.repository';

@Injectable()
export class RacksService {
  constructor(private readonly repository: RacksRepository) {}

  async getRack(rackId: string): Promise<RackDetail> {
    const row = await this.repository.getRack(rackId);
    if (!row) throw new NotFoundException('Rack not found');
    return toDetail(row);
  }
}

function toDetail(row: RackDetailRow): RackDetail {
  return {
    id: row.id,
    assetTag: row.asset_tag,
    name: row.name,
    category: { code: row.category, name: row.category_name },
    model: row.model_id ? {
      id: row.model_id,
      manufacturer: row.manufacturer,
      modelCode: row.model_code,
      displayName: row.model_display_name,
      defaultPowerKw: toNumberOrNull(row.default_power_kw),
      defaultCoolingKw: toNumberOrNull(row.default_cooling_kw),
      rackUnits: toNumberOrNull(row.rack_units),
      weightKg: toNumberOrNull(row.weight_kg),
      meshId: row.mesh_id,
      spec: row.spec_json,
    } : null,
    serialNo: row.serial_no,
    status: row.status,
    location: {
      site: toNode(row.site_id, row.site_name),
      building: toNode(row.building_id, row.building_name),
      floor: toNode(row.floor_id, row.floor_name),
      hall: toNode(row.hall_id, row.hall_name),
      zone: toNode(row.zone_id, row.zone_name),
      row: toNode(row.row_id, row.row_name),
      rackPosition: toNode(row.rack_position_id, row.rack_position_name),
    },
    capacity: {
      maxU: toNumberOrNull(row.max_u),
      usedU: null,
      maxPowerKw: toNumberOrNull(row.max_power_kw),
      usedPowerKw: null,
    },
    units: [],
    containedAssets: [],
    activeAlarmSummary: null,
  };
}

function toNode(id: string | null, name: string | null) {
  return id ? { id, name: name ?? '' } : null;
}

function toNumberOrNull(value: number | string | null): number | null {
  return value === null ? null : Number(value);
}
