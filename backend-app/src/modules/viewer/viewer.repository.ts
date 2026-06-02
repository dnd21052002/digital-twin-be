import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DbService } from '../../db/db.service';
import { ViewpointsQueryDto } from './dto/viewpoints-query.dto';
import { ViewpointRow } from './viewer.types';

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
}
