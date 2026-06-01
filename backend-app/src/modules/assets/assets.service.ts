import { Injectable, NotFoundException } from '@nestjs/common';
import { AssetDetail, AssetListResponse, AssetSummary } from './assets.types';
import { AssetDetailRow, AssetSummaryRow, AssetsRepository } from './assets.repository';
import { AssetsQueryDto } from './dto/assets-query.dto';

@Injectable()
export class AssetsService {
  constructor(private readonly repository: AssetsRepository) {}

  async listAssets(query: AssetsQueryDto): Promise<AssetListResponse> {
    const limit = query.limit ?? 50;
    const rows = await this.repository.listAssets(query);
    const pageRows = rows.slice(0, limit);
    const items = pageRows.map(toSummary);
    return {
      items,
      nextCursor: rows.length > limit ? items[items.length - 1]?.id ?? null : null,
    };
  }

  async getAsset(assetId: string): Promise<AssetDetail> {
    const row = await this.repository.getAsset(assetId);
    if (!row) throw new NotFoundException('Asset not found');
    return toDetail(row);
  }
}

function toSummary(row: AssetSummaryRow): AssetSummary {
  return {
    id: row.id,
    assetTag: row.asset_tag,
    name: row.name,
    category: row.category,
    status: row.status,
    location: {
      siteId: row.site_id,
      buildingId: row.building_id,
      floorId: row.floor_id,
      hallId: row.hall_id,
      zoneId: row.zone_id,
      rowId: row.row_id,
      rackPositionId: row.rack_position_id,
    },
  };
}

function toDetail(row: AssetDetailRow): AssetDetail {
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
    geometry: {
      rotationDeg: toNumberOrNull(row.rotation_deg),
      coordinates: row.coordinates,
    },
    attributes: row.attributes,
  };
}

function toNode(id: string | null, name: string | null) {
  return id ? { id, name: name ?? '' } : null;
}

function toNumberOrNull(value: number | string | null): number | null {
  return value === null ? null : Number(value);
}
