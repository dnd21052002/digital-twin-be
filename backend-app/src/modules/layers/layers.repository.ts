import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DbService } from '../../db/db.service';
import { LayerInstancesQueryDto, ThermalQueryDto, AirflowQueryDto, PowerPathsQueryDto } from './dto/layers-query.dto';
import { LayerTypeRow, LayerInstanceRow, ThermalGridRow, AirflowRow, PowerPathRow, UserLayerStateRow } from './layers.types';

@Injectable()
export class LayersRepository {
  constructor(private readonly dbService: DbService) {}
  private get db() { return this.dbService.db; }

  async listLayerTypes(): Promise<LayerTypeRow[]> {
    const exists = await sql<{ exists: boolean }>`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='layer' AND table_name='layer_type') AS exists
    `.execute(this.db);
    if (!exists.rows[0]?.exists) return [];

    const result = await sql<LayerTypeRow>`
      SELECT layer_type_id, code::text, name, default_opacity, data_source_kind::text
      FROM layer.layer_type ORDER BY name ASC
    `.execute(this.db);
    return result.rows;
  }

  async listLayerInstances(query: LayerInstancesQueryDto): Promise<LayerInstanceRow[]> {
    const exists = await sql<{ exists: boolean }>`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='layer' AND table_name='layer_instance') AS exists
    `.execute(this.db);
    if (!exists.rows[0]?.exists) return [];

    const result = await sql<LayerInstanceRow>`
      SELECT li.layer_instance_id::text, li.scene_id::text, li.layer_type_id, li.name,
             li.is_enabled_default, li.default_opacity, li.config
      FROM layer.layer_instance li
      WHERE (${query.sceneId ?? null}::uuid IS NULL OR li.scene_id = ${query.sceneId ?? null}::uuid)
        AND (${query.type ?? null}::text IS NULL OR li.layer_type_id = (
          SELECT layer_type_id FROM layer.layer_type WHERE code::text = ${query.type ?? null}::text
        ))
      ORDER BY li.display_order ASC, li.name ASC
    `.execute(this.db);
    return result.rows;
  }

  async findHallIdsByScene(sceneId: string): Promise<number[]> {
    const result = await sql<{ hall_id: number }>`
      SELECT h.hall_id
      FROM facility.hall h
      JOIN facility.floor f ON f.floor_id = h.floor_id
      JOIN facility.building b ON b.building_id = f.building_id
      JOIN geom3d.scene s ON s.site_id = b.site_id
      WHERE s.scene_id = ${sceneId}::uuid
    `.execute(this.db);
    return result.rows.map(r => r.hall_id);
  }

  async thermalGrid(sceneId: string, _at?: string, _grid?: string): Promise<ThermalGridRow[]> {
    const hallIds = await this.findHallIdsByScene(sceneId);
    if (hallIds.length === 0) return [];

    const [gx, gy] = _grid?.split('x').map(Number) ?? [12, 4];

    const result = await sql<ThermalGridRow>`
      SELECT tgc.cell_id, tgc.grid_x, tgc.grid_y, tgc.grid_z,
             ms.value, '°C' AS unit
      FROM layer.thermal_grid_cell tgc
      LEFT JOIN LATERAL (
        SELECT ms.value
        FROM telemetry.metric_sample ms
        JOIN telemetry.metric_definition md ON md.metric_id = ms.metric_id AND md.code = 'temp_c'
        WHERE ms.asset_id = (SELECT a.asset_id FROM asset.asset a WHERE a.hall_id = tgc.hall_id LIMIT 1)
        ORDER BY ms.time DESC LIMIT 1
      ) ms ON TRUE
      WHERE tgc.hall_id = ANY(${hallIds}::bigint[])
        AND tgc.grid_x < ${gx} AND tgc.grid_y < ${gy}
      ORDER BY tgc.grid_z, tgc.grid_y, tgc.grid_x
    `.execute(this.db);
    return result.rows;
  }

  async airflowVectors(sceneId: string): Promise<AirflowRow[]> {
    const hallIds = await this.findHallIdsByScene(sceneId);
    if (hallIds.length === 0) return [];

    const result = await sql<AirflowRow>`
      SELECT av.vector_id,
             ST_X(av.origin::geometry) AS origin_x,
             ST_Y(av.origin::geometry) AS origin_y,
             COALESCE(ST_Z(av.origin::geometry), 0) AS origin_z,
             av.direction_x, av.direction_y, av.direction_z,
             av.magnitude_m_s, av.measured_at
      FROM layer.airflow_vector av
      WHERE av.hall_id = ANY(${hallIds}::bigint[])
      ORDER BY av.measured_at DESC LIMIT 500
    `.execute(this.db);
    return result.rows;
  }

  async powerPaths(sceneId: string): Promise<PowerPathRow[]> {
    const result = await sql<PowerPathRow>`
      SELECT ppv.path_id,
             ppv.source_asset_id::text AS from_asset_id,
             ppv.target_asset_id::text AS to_asset_id,
             ac.connection_type::text AS connection_type,
             ST_AsGeoJSON(ppv.path_geom)::jsonb AS path_geom
      FROM layer.power_path_visual ppv
      JOIN asset.connection ac ON ac.from_asset_id = ppv.source_asset_id AND ac.to_asset_id = ppv.target_asset_id
      JOIN asset.asset a ON a.asset_id = ppv.source_asset_id
      JOIN facility.hall h ON h.hall_id = a.hall_id
      JOIN facility.floor f ON f.floor_id = h.floor_id
      JOIN facility.building b ON b.building_id = f.building_id
      JOIN geom3d.scene s ON s.site_id = b.site_id
      WHERE s.scene_id = ${sceneId}::uuid
      ORDER BY ppv.path_id
    `.execute(this.db);
    return result.rows;
  }

  async upsertUserLayerState(userId: string, layerInstanceId: string, visible: boolean, opacity: number): Promise<void> {
    await sql`
      INSERT INTO layer.user_layer_state (user_id, layer_instance_id, is_enabled, opacity, updated_at)
      VALUES (${userId}::uuid, ${layerInstanceId}::uuid, ${visible}, ${opacity}, now())
      ON CONFLICT (user_id, layer_instance_id)
      DO UPDATE SET is_enabled = EXCLUDED.is_enabled, opacity = EXCLUDED.opacity, updated_at = now()
    `.execute(this.db);
  }

  async findUserLayerStates(userId: string, sceneId?: string): Promise<UserLayerStateRow[]> {
    const result = await sql<UserLayerStateRow>`
      SELECT
        uls.user_id::text,
        uls.layer_instance_id::text,
        uls.is_enabled,
        uls.opacity
      FROM layer.user_layer_state uls
      WHERE uls.user_id = ${userId}::uuid
      ORDER BY uls.layer_instance_id
    `.execute(this.db);
    return result.rows;
  }

  async findLayerInstanceIdByType(layerTypeCode: string, sceneId: string): Promise<string | null> {
    const result = await sql<{ layer_instance_id: string }>`
      SELECT li.layer_instance_id::text
      FROM layer.layer_instance li
      JOIN layer.layer_type lt ON lt.layer_type_id = li.layer_type_id
      WHERE lt.code::text = ${layerTypeCode} AND li.scene_id = ${sceneId}::uuid
      LIMIT 1
    `.execute(this.db);
    return result.rows[0]?.layer_instance_id ?? null;
  }
}
