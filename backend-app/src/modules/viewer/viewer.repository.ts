import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DbService } from '../../db/db.service';
import { ViewpointsQueryDto } from './dto/viewpoints-query.dto';
import { CreateViewPresetDto } from './dto/create-view-preset.dto';
import { ViewpointRow, ViewPresetRow } from './viewer.types';

@Injectable()
export class ViewerRepository {
  constructor(private readonly dbService: DbService) {}
  private get db() { return this.dbService.db; }

  async listViewpoints(query: ViewpointsQueryDto): Promise<ViewpointRow[]> {
    const table = await sql<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'viewer'
          AND table_name = 'viewpoint'
      ) AS exists
    `.execute(this.db);

    if (!table.rows[0]?.exists) return [];

    const result = await sql<ViewpointRow>`
      SELECT
        viewpoint_id::text AS id,
        scene_id::text AS scene_id,
        name,
        nav_mode::text AS type,
        jsonb_build_object(
          'x', ST_X(target::geometry),
          'y', ST_Y(target::geometry),
          'z', COALESCE(ST_Z(target::geometry), 0)
        ) AS target,
        jsonb_build_object(
          'position', jsonb_build_object(
            'x', ST_X(position::geometry),
            'y', ST_Y(position::geometry),
            'z', COALESCE(ST_Z(position::geometry), 0)
          ),
          'upVector', up_vector,
          'fovDeg', fov_deg,
          'rollDeg', roll_deg,
          'navMode', nav_mode::text
        ) AS camera,
        display_order AS sort_order
      FROM viewer.viewpoint
      WHERE (${query.sceneId ?? null}::uuid IS NULL OR scene_id = ${query.sceneId ?? null}::uuid)
        AND (${query.type ?? null}::text IS NULL OR nav_mode::text = ${query.type ?? null}::text)
      ORDER BY display_order ASC NULLS LAST, name ASC
    `.execute(this.db);

    return result.rows;
  }

  async createViewPreset(userId: string, dto: CreateViewPresetDto): Promise<ViewPresetRow> {
    const r = await sql<ViewPresetRow>`
      INSERT INTO viewer.user_view_preset (user_id, scene_id, name, position, target, fov_deg)
      VALUES (
        ${userId},
        ${dto.sceneId ?? null}::uuid,
        ${dto.name},
        ST_MakePoint(${dto.position.x}, ${dto.position.y}, ${dto.position.z}),
        ST_MakePoint(${dto.target.x}, ${dto.target.y}, ${dto.target.z}),
        ${dto.fov ?? null}
      )
      RETURNING preset_id, name, user_id, scene_id::text AS scene_id, created_at
    `.execute(this.db);
    return r.rows[0];
  }
}
