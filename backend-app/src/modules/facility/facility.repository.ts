import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DbService } from '../../db/db.service';

export interface FacilityTreeRow {
  site_id: string;
  site_code: string;
  site_name: string;
  site_timezone: string | null;
  building_id: string | null;
  building_code: string | null;
  building_name: string | null;
  building_floor_count: number | string | null;
  floor_id: string | null;
  floor_level: number | string | null;
  floor_code: string | null;
  floor_name: string | null;
  hall_id: string | null;
  hall_code: string | null;
  hall_name: string | null;
  hall_area_m2: number | string | null;
  zone_id: string | null;
  zone_code: string | null;
  zone_name: string | null;
  zone_type: string | null;
  row_id: string | null;
  row_code: string | null;
  row_orientation_deg: number | string | null;
  rack_pos_id: string | null;
  rack_pos_code: string | null;
  rack_pos_position_index: number | string | null;
  rack_pos_max_u: number | string | null;
  rack_pos_max_power_kw: number | string | null;
  rack_pos_current_rack_id: string | null;
}

@Injectable()
export class FacilityRepository {
  constructor(private readonly dbService: DbService) {}
  private get db() { return this.dbService.db; }

  async getTreeRows(): Promise<FacilityTreeRow[]> {
    const result = await sql<FacilityTreeRow>`
      SELECT
        s.site_id::text AS site_id,
        s.code AS site_code,
        s.name AS site_name,
        s.timezone AS site_timezone,
        b.building_id::text AS building_id,
        b.code AS building_code,
        b.name AS building_name,
        b.floor_count AS building_floor_count,
        f.floor_id::text AS floor_id,
        f.level AS floor_level,
        f.code AS floor_code,
        f.name AS floor_name,
        h.hall_id::text AS hall_id,
        h.code AS hall_code,
        h.name AS hall_name,
        h.area_m2 AS hall_area_m2,
        z.zone_id::text AS zone_id,
        z.code AS zone_code,
        z.name AS zone_name,
        z.zone_type::text AS zone_type,
        NULL::text AS row_id,
        NULL::text AS row_code,
        NULL::numeric AS row_orientation_deg,
        NULL::text AS rack_pos_id,
        NULL::text AS rack_pos_code,
        NULL::integer AS rack_pos_position_index,
        NULL::integer AS rack_pos_max_u,
        NULL::numeric AS rack_pos_max_power_kw,
        NULL::text AS rack_pos_current_rack_id
      FROM facility.site s
      LEFT JOIN facility.building b
        ON b.site_id = s.site_id
       AND b.deleted_at IS NULL
      LEFT JOIN facility.floor f
        ON f.building_id = b.building_id
      LEFT JOIN facility.hall h
        ON h.floor_id = f.floor_id
      LEFT JOIN facility.zone z
        ON z.hall_id = h.hall_id
      WHERE s.deleted_at IS NULL

      UNION ALL

      SELECT
        s.site_id::text AS site_id,
        s.code AS site_code,
        s.name AS site_name,
        s.timezone AS site_timezone,
        b.building_id::text AS building_id,
        b.code AS building_code,
        b.name AS building_name,
        b.floor_count AS building_floor_count,
        f.floor_id::text AS floor_id,
        f.level AS floor_level,
        f.code AS floor_code,
        f.name AS floor_name,
        h.hall_id::text AS hall_id,
        h.code AS hall_code,
        h.name AS hall_name,
        h.area_m2 AS hall_area_m2,
        NULL::text AS zone_id,
        NULL::text AS zone_code,
        NULL::text AS zone_name,
        NULL::text AS zone_type,
        r.row_id::text AS row_id,
        r.code AS row_code,
        r.orientation_deg AS row_orientation_deg,
        rp.rack_pos_id::text AS rack_pos_id,
        rp.code AS rack_pos_code,
        rp.position_index AS rack_pos_position_index,
        rp.max_u AS rack_pos_max_u,
        rp.max_power_kw AS rack_pos_max_power_kw,
        rp.current_rack_id::text AS rack_pos_current_rack_id
      FROM facility.site s
      LEFT JOIN facility.building b
        ON b.site_id = s.site_id
       AND b.deleted_at IS NULL
      LEFT JOIN facility.floor f
        ON f.building_id = b.building_id
      LEFT JOIN facility.hall h
        ON h.floor_id = f.floor_id
      LEFT JOIN facility.row r
        ON r.hall_id = h.hall_id
      LEFT JOIN facility.rack_position rp
        ON rp.row_id = r.row_id
      WHERE s.deleted_at IS NULL
        AND r.row_id IS NOT NULL
      ORDER BY
        site_code,
        building_code NULLS LAST,
        floor_level NULLS LAST,
        floor_code NULLS LAST,
        hall_code NULLS LAST,
        zone_code NULLS LAST,
        row_code NULLS LAST,
        rack_pos_position_index NULLS LAST,
        rack_pos_code NULLS LAST
    `.execute(this.db);

    return result.rows;
  }
}
