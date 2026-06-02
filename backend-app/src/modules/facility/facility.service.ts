import { Injectable } from '@nestjs/common';
import { RackPositionsQueryDto } from './dto/rack-positions-query.dto';
import { FacilityRepository } from './facility.repository';
import { BuildingNode, FacilityTreeResponse, FloorNode, HallNode, RackPositionNode, RackPositionsResponse, RowNode, SiteNode, ZoneNode } from './facility.types';

@Injectable()
export class FacilityService {
  constructor(private readonly repository: FacilityRepository) {}

  async getRackPositions(query: RackPositionsQueryDto): Promise<RackPositionsResponse> {
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const rows = await this.repository.listRackPositions({ ...query, limit });
    const page = rows.slice(0, limit);

    return {
      items: page.map(row => ({
        id: row.id,
        code: row.code,
        positionIndex: toNumber(row.position_index),
        maxU: toNumberOrNull(row.max_u),
        maxPowerKw: toNumberOrNull(row.max_power_kw),
        currentRackId: row.current_rack_id,
        location: {
          siteId: row.site_id,
          buildingId: row.building_id,
          floorId: row.floor_id,
          hallId: row.hall_id,
          zoneId: row.zone_id,
          rowId: row.row_id,
        },
      })),
      nextCursor: rows.length > limit ? page[page.length - 1]?.id ?? null : null,
    };
  }

  async getTree(): Promise<FacilityTreeResponse> {
    const rows = await this.repository.getTreeRows();
    const sites = new Map<string, SiteNode>();
    const buildings = new Map<string, BuildingNode>();
    const floors = new Map<string, FloorNode>();
    const halls = new Map<string, HallNode>();
    const zones = new Map<string, ZoneNode>();
    const hallRows = new Map<string, RowNode>();
    const rackPositions = new Set<string>();

    for (const row of rows) {
      const site = getOrCreate(sites, row.site_id, () => ({
        id: row.site_id,
        code: row.site_code,
        name: row.site_name,
        timezone: row.site_timezone,
        buildings: [],
      }));

      if (!row.building_id) continue;
      const building = getOrCreate(buildings, row.building_id, () => {
        const node: BuildingNode = {
          id: row.building_id!,
          code: row.building_code!,
          name: row.building_name!,
          floorCount: toNumberOrNull(row.building_floor_count),
          floors: [],
        };
        site.buildings.push(node);
        return node;
      });

      if (!row.floor_id) continue;
      const floor = getOrCreate(floors, row.floor_id, () => {
        const node: FloorNode = {
          id: row.floor_id!,
          code: row.floor_code!,
          name: row.floor_name!,
          level: toNumber(row.floor_level),
          halls: [],
        };
        building.floors.push(node);
        return node;
      });

      if (!row.hall_id) continue;
      const hall = getOrCreate(halls, row.hall_id, () => {
        const node: HallNode = {
          id: row.hall_id!,
          code: row.hall_code!,
          name: row.hall_name!,
          areaM2: toNumberOrNull(row.hall_area_m2),
          zones: [],
          rows: [],
        };
        floor.halls.push(node);
        return node;
      });

      if (row.zone_id) {
        getOrCreate(zones, row.zone_id, () => {
          const node: ZoneNode = {
            id: row.zone_id!,
            code: row.zone_code!,
            name: row.zone_name!,
            zoneType: row.zone_type!,
            rows: [],
          };
          hall.zones.push(node);
          return node;
        });
      }

      if (!row.row_id) continue;
      const hallRow = getOrCreate(hallRows, row.row_id, () => {
        const node: RowNode = {
          id: row.row_id!,
          code: row.row_code!,
          orientationDeg: toNumberOrNull(row.row_orientation_deg),
          rackPositions: [],
        };
        hall.rows.push(node);
        return node;
      });

      if (!row.rack_pos_id || rackPositions.has(row.rack_pos_id)) continue;
      const rackPosition: RackPositionNode = {
        id: row.rack_pos_id,
        code: row.rack_pos_code!,
        positionIndex: toNumber(row.rack_pos_position_index),
        maxU: toNumberOrNull(row.rack_pos_max_u),
        maxPowerKw: toNumberOrNull(row.rack_pos_max_power_kw),
        currentRackId: row.rack_pos_current_rack_id,
      };
      hallRow.rackPositions.push(rackPosition);
      rackPositions.add(row.rack_pos_id);
    }

    return { sites: Array.from(sites.values()) };
  }
}

function getOrCreate<K, V>(map: Map<K, V>, key: K, create: () => V): V {
  const existing = map.get(key);
  if (existing) return existing;
  const value = create();
  map.set(key, value);
  return value;
}

function toNumber(value: number | string | null): number {
  return Number(value ?? 0);
}

function toNumberOrNull(value: number | string | null): number | null {
  return value === null ? null : Number(value);
}
