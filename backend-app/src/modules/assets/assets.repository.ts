import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DbService } from '../../db/db.service';
import { AssetsQueryDto } from './dto/assets-query.dto';

export interface AssetSummaryRow {
  id: string;
  asset_tag: string;
  name: string;
  category: string;
  status: string;
  site_id: string | null;
  building_id: string | null;
  floor_id: string | null;
  hall_id: string | null;
  zone_id: string | null;
  row_id: string | null;
  rack_position_id: string | null;
}

export interface AssetDetailRow extends AssetSummaryRow {
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
  site_name: string | null;
  building_name: string | null;
  floor_name: string | null;
  hall_name: string | null;
  zone_name: string | null;
  row_name: string | null;
  rack_position_name: string | null;
  rotation_deg: number | string | null;
  coordinates: unknown | null;
  attributes: unknown;
}

@Injectable()
export class AssetsRepository {
  constructor(private readonly dbService: DbService) {}
  private get db() { return this.dbService.db; }

  async listAssets(query: AssetsQueryDto): Promise<AssetSummaryRow[]> {
    const limit = query.limit ?? 50;
    const q = query.q ? `%${query.q}%` : null;
    const result = await sql<AssetSummaryRow>`
      SELECT
        a.asset_id::text AS id,
        a.asset_tag,
        a.display_name AS name,
        a.category_code AS category,
        a.status::text AS status,
        s.site_id::text AS site_id,
        b.building_id::text AS building_id,
        f.floor_id::text AS floor_id,
        h.hall_id::text AS hall_id,
        z.zone_id::text AS zone_id,
        r.row_id::text AS row_id,
        rp.rack_pos_id::text AS rack_position_id
      FROM asset.asset a
      LEFT JOIN facility.rack_position rp ON rp.rack_pos_id = a.rack_pos_id
      LEFT JOIN facility.row r ON r.row_id = rp.row_id
      LEFT JOIN facility.zone z ON z.zone_id = a.zone_id
      LEFT JOIN facility.hall h ON h.hall_id = COALESCE(r.hall_id, a.hall_id, z.hall_id)
      LEFT JOIN facility.floor f ON f.floor_id = h.floor_id
      LEFT JOIN facility.building b ON b.building_id = f.building_id
      LEFT JOIN facility.site s ON s.site_id = b.site_id
      WHERE a.deleted_at IS NULL
        AND (${q}::text IS NULL OR a.asset_tag ILIKE ${q} OR a.display_name ILIKE ${q})
        AND (${query.category ?? null}::text IS NULL OR a.category_code = ${query.category ?? null})
        AND (${query.status ?? null}::text IS NULL OR a.status::text = ${query.status ?? null})
        AND (${query.siteId ?? null}::text IS NULL OR s.site_id::text = ${query.siteId ?? null})
        AND (${query.cursor ?? null}::text IS NULL OR a.asset_id::text > ${query.cursor ?? null})
      ORDER BY a.asset_id::text
      LIMIT ${limit + 1}
    `.execute(this.db);
    return result.rows;
  }

  async getAsset(assetId: string): Promise<AssetDetailRow | null> {
    const result = await sql<AssetDetailRow>`
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
        a.rotation_deg,
        ST_AsGeoJSON(a.geom)::json AS coordinates,
        a.attributes
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
        AND a.asset_id = ${assetId}
      LIMIT 1
    `.execute(this.db);
    return result.rows[0] ?? null;
  }
}
