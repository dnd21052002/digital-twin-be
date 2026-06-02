import { Injectable, NotFoundException } from '@nestjs/common';
import { SceneAssetSummary, SceneAssetsQuery, SceneAssetsResponse, SceneManifest, ScenesResponse } from './scenes.types';
import { SceneAssetSummaryRow, ScenesRepository } from './scenes.repository';

@Injectable()
export class ScenesService {
  constructor(private readonly repository: ScenesRepository) {}

  listScenes(): Promise<ScenesResponse> {
    return this.repository.listScenes();
  }

  async listSceneAssets(sceneId: string, query: SceneAssetsQuery): Promise<SceneAssetsResponse> {
    if (!(await this.repository.sceneExists(sceneId))) throw new NotFoundException('Scene not found');

    const limit = clampLimit(query.limit);
    const rows = await this.repository.listSceneAssets(sceneId, { ...query, limit });
    const pageRows = rows.slice(0, limit);
    const items = pageRows.map(toSceneAssetSummary);
    return {
      items,
      nextCursor: rows.length > limit ? items[items.length - 1]?.id ?? null : null,
    };
  }

  async getSceneManifest(sceneId: string): Promise<SceneManifest> {
    const manifest = await this.repository.getSceneManifest(sceneId);
    if (!manifest) throw new NotFoundException('Scene not found');
    return manifest;
  }
}

function toSceneAssetSummary(row: SceneAssetSummaryRow): SceneAssetSummary {
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
    geometry: {
      rotationDeg: row.rotation_deg == null ? null : Number(row.rotation_deg),
      coordinates: row.coordinates,
    },
  };
}

function clampLimit(limit?: number): number {
  if (!Number.isFinite(limit)) return 500;
  return Math.min(Math.max(Math.trunc(limit as number), 1), 1000);
}
