import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DbService } from '../../db/db.service';
import { SceneAssetsQuery, SceneManifest, ScenesResponse, SceneSummary } from './scenes.types';

interface SceneRow {
  id: string;
  site_id: string;
  name: string;
  default_camera_id: string | null;
  environment: unknown;
  lod_strategy: string;
  is_default: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface SceneAssetSummaryRow {
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
  rotation_deg: number | string | null;
  coordinates: unknown | null;
}

@Injectable()
export class ScenesRepository {
  constructor(private readonly dbService: DbService) {}
  private get db() { return this.dbService.db; }

  async listScenes(): Promise<ScenesResponse> {
    const result = await sql<SceneRow>`
      SELECT
        scene_id::text AS id,
        site_id::text AS site_id,
        name,
        default_camera_id::text AS default_camera_id,
        environment,
        lod_strategy::text AS lod_strategy,
        is_default,
        created_at,
        updated_at
      FROM geom3d.scene
      ORDER BY is_default DESC, name ASC
    `.execute(this.db);

    return { items: result.rows.map(toSceneSummary) };
  }

  async sceneExists(sceneId: string): Promise<boolean> {
    const result = await sql<{ exists: boolean }>`
      SELECT EXISTS(SELECT 1 FROM geom3d.scene WHERE scene_id = ${sceneId}) AS exists
    `.execute(this.db);
    return result.rows[0]?.exists ?? false;
  }

  async listSceneAssets(sceneId: string, query: SceneAssetsQuery): Promise<SceneAssetSummaryRow[]> {
    const limit = clampLimit(query.limit);
    const bbox = parseBbox(query.bbox);
    const result = await sql<SceneAssetSummaryRow>`
      WITH selected_scene AS (
        SELECT scene_id, site_id
        FROM geom3d.scene
        WHERE scene_id = ${sceneId}
        LIMIT 1
      )
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
        rp.rack_pos_id::text AS rack_position_id,
        a.rotation_deg,
        ST_AsGeoJSON(a.geom)::json AS coordinates
      FROM selected_scene ss
      JOIN asset.asset a ON TRUE
      LEFT JOIN facility.rack_position rp ON rp.rack_pos_id = a.rack_pos_id
      LEFT JOIN facility.row r ON r.row_id = rp.row_id
      LEFT JOIN facility.zone z ON z.zone_id = a.zone_id
      LEFT JOIN facility.hall h ON h.hall_id = COALESCE(r.hall_id, a.hall_id, z.hall_id)
      LEFT JOIN facility.floor f ON f.floor_id = h.floor_id
      LEFT JOIN facility.building b ON b.building_id = f.building_id
      LEFT JOIN facility.site s ON s.site_id = b.site_id
      WHERE a.deleted_at IS NULL
        AND s.site_id = ss.site_id
        AND (${query.cursor ?? null}::text IS NULL OR a.asset_id::text > ${query.cursor ?? null})
        AND (
          ${bbox ? bbox[0] : null}::float8 IS NULL
          OR a.geom IS NULL
          OR ST_Intersects(a.geom, ST_MakeEnvelope(${bbox ? bbox[0] : null}, ${bbox ? bbox[1] : null}, ${bbox ? bbox[3] : null}, ${bbox ? bbox[4] : null}, 4326))
        )
      ORDER BY a.asset_id::text
      LIMIT ${limit + 1}
    `.execute(this.db);
    return result.rows;
  }

  async getSceneManifest(sceneId: string): Promise<SceneManifest | null> {
    const sceneResult = await sql<SceneRow>`
      SELECT
        scene_id::text AS id,
        site_id::text AS site_id,
        name,
        default_camera_id::text AS default_camera_id,
        environment,
        lod_strategy::text AS lod_strategy,
        is_default,
        created_at,
        updated_at
      FROM geom3d.scene
      WHERE scene_id = ${sceneId}
      LIMIT 1
    `.execute(this.db);
    const scene = sceneResult.rows[0];
    if (!scene) return null;

    return {
      scene: {
        ...toSceneSummary(scene),
        environment: scene.environment,
        defaultCameraId: scene.default_camera_id,
      },
      meshes: [],
      textures: [],
    };
  }
}

function toSceneSummary(row: SceneRow): SceneSummary {
  return {
    id: row.id,
    siteId: row.site_id,
    name: row.name,
    isDefault: row.is_default,
    lodStrategy: row.lod_strategy,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function clampLimit(limit?: number): number {
  if (!Number.isFinite(limit)) return 500;
  return Math.min(Math.max(Math.trunc(limit as number), 1), 1000);
}

function parseBbox(bbox?: string): [number, number, number, number, number, number] | null {
  if (!bbox) return null;
  const values = bbox.split(',').map((value) => Number(value.trim()));
  if (values.length !== 6 || values.some((value) => !Number.isFinite(value))) return null;
  const [minX, minY, minZ, maxX, maxY, maxZ] = values;
  if (minX > maxX || minY > maxY || minZ > maxZ) return null;
  return [minX, minY, minZ, maxX, maxY, maxZ];
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
