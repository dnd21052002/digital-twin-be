import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DbService } from '../../db/db.service';

export interface RackDetailRow {
  id: string;
  asset_tag: string;
  name: string;
  category: string;
  status: string;
  category_name: string | null;
  model_id: string | null;
  manufacturer: string | null;
  model_code: string | null;
  model_display_name: string | null;
  default_power_kw: number | string | null;
  default_cooling_kw: number | string | null;
  rack_units: number | string | null;
  weight_kg: number | string | null;
  mesh_id: string | null;
  spec_json: unknown;
  serial_no: string | null;
  site_id: string | null;
  site_name: string | null;
  building_id: string | null;
  building_name: string | null;
  floor_id: string | null;
  floor_name: string | null;
  hall_id: string | null;
  hall_name: string | null;
  zone_id: string | null;
  zone_name: string | null;
  row_id: string | null;
  row_name: string | null;
  rack_position_id: string | null;
  rack_position_name: string | null;
  max_u: number | string | null;
  max_power_kw: number | string | null;
}

@Injectable()
export class RacksRepository {
  constructor(private readonly dbService: DbService) {}
  private get db() { return this.dbService.db; }

  async getRack(rackId: string): Promise<RackDetailRow | null> {
    const result = await sql<RackDetailRow>`
      SELECT
        a.asset_id::text AS id,
        a.asset_tag,
        a.display_name AS name,
        a.category_code AS category,
        a.status::text AS status,
        ac.name AS category_name,
        am.model_id::text AS model_id,
        am.manufacturer,
        am.model_code,
        am.display_name AS model_display_name,
        am.default_power_kw,
        am.default_cooling_kw,
        am.rack_units,
        am.weight_kg,
        am.mesh_id::text AS mesh_id,
        am.spec_json,
        a.serial_no,
        s.site_id::text AS site_id,
        s.name AS site_name,
        b.building_id::text AS building_id,
        b.name AS building_name,
        f.floor_id::text AS floor_id,
        f.name AS floor_name,
        h.hall_id::text AS hall_id,
        h.name AS hall_name,
        z.zone_id::text AS zone_id,
        z.name AS zone_name,
        r.row_id::text AS row_id,
        r.code AS row_name,
        rp.rack_pos_id::text AS rack_position_id,
        rp.code AS rack_position_name,
        rp.max_u,
        rp.max_power_kw
      FROM asset.asset a
      LEFT JOIN asset.asset_category ac ON ac.code = a.category_code
      LEFT JOIN asset.asset_model am ON am.model_id = a.model_id
      LEFT JOIN facility.rack_position rp ON rp.rack_pos_id = a.rack_pos_id
      LEFT JOIN facility.row r ON r.row_id = rp.row_id
      LEFT JOIN facility.zone z ON z.zone_id = a.zone_id
      LEFT JOIN facility.hall h ON h.hall_id = COALESCE(r.hall_id, a.hall_id, z.hall_id)
      LEFT JOIN facility.floor f ON f.floor_id = h.floor_id
      LEFT JOIN facility.building b ON b.building_id = f.building_id
      LEFT JOIN facility.site s ON s.site_id = b.site_id
      WHERE a.deleted_at IS NULL
        AND a.asset_id = ${rackId}
      LIMIT 1
    `.execute(this.db);
    return result.rows[0] ?? null;
  }
}
