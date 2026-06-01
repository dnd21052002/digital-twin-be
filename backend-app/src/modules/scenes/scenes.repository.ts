import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DbService } from '../../db/db.service';
import { SceneManifest, ScenesResponse, SceneSummary } from './scenes.types';

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


function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

