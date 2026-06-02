import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { LayersRepository } from './layers.repository';
import {
  AirflowResponse, AirflowVector, LayerInstanceSummary, LayerInstancesResponse,
  LayerTypesResponse, LayerTypeSummary, PowerPathSummary, PowerPathsResponse,
  ThermalGridCell, ThermalGridResponse, UserLayerStateRow,
} from './layers.types';
import { LayerInstancesQueryDto, ThermalQueryDto, UserLayerStateDto } from './dto/layers-query.dto';
import { Request } from 'express';

@Injectable()
export class LayersService {
  constructor(private readonly repository: LayersRepository) {}

  async listLayerTypes(): Promise<LayerTypesResponse> {
    const rows = await this.repository.listLayerTypes();
    return { items: rows.map(toLayerTypeSummary) };
  }

  async listLayerInstances(query: LayerInstancesQueryDto): Promise<LayerInstancesResponse> {
    const rows = await this.repository.listLayerInstances(query);
    return { items: rows.map(toLayerInstanceSummary) };
  }

  async thermalGrid(query: ThermalQueryDto): Promise<ThermalGridResponse> {
    if (!query.sceneId) throw new NotFoundException('sceneId is required');
    const rows = await this.repository.thermalGrid(query.sceneId, query.at, query.grid);
    return { grid: rows.map(toThermalGridCell) };
  }

  async airflowVectors(sceneId: string): Promise<AirflowResponse> {
    if (!sceneId) throw new NotFoundException('sceneId is required');
    const rows = await this.repository.airflowVectors(sceneId);
    return { vectors: rows.map(toAirflowVector) };
  }

  async powerPaths(sceneId: string): Promise<PowerPathsResponse> {
    if (!sceneId) throw new NotFoundException('sceneId is required');
    const rows = await this.repository.powerPaths(sceneId);
    return { paths: rows.map(toPowerPathSummary) };
  }

  async getUserLayerState(req: Request): Promise<{ items: any[] }> {
    const userId = (req as any).user?.sub;
    if (!userId) throw new InternalServerErrorException('User not authenticated');
    const rows = await this.repository.findUserLayerStates(userId);
    return { items: rows.map(r => ({ userId: r.user_id, layerInstanceId: r.layer_instance_id, visible: r.is_enabled, opacity: Number(r.opacity) })) };
  }

  async saveUserLayerState(req: Request, dto: UserLayerStateDto): Promise<{ ok: true }> {
    const userId = (req as any).user?.sub;
    if (!userId) throw new InternalServerErrorException('User not authenticated');

    let layerInstanceId = dto.layerInstanceId;
    if (!layerInstanceId && dto.layerType) {
      // Try looking up by layer type code if no instanceId provided
      const found = await this.repository.findLayerInstanceIdByType(dto.layerType, dto.sceneId ?? '');
      if (found) layerInstanceId = found;
    }
    if (!layerInstanceId) throw new NotFoundException('Layer instance not found');

    const visible = dto.visible ?? true;
    const opacity = dto.opacity ?? 0.7;
    await this.repository.upsertUserLayerState(userId, layerInstanceId, visible, opacity);
    return { ok: true };
  }
}

function toLayerTypeSummary(row: any): LayerTypeSummary {
  return {
    id: Number(row.layer_type_id),
    code: row.code,
    name: row.name,
    defaultOpacity: Number(row.default_opacity),
    dataSourceKind: row.data_source_kind,
  };
}

function toLayerInstanceSummary(row: any): LayerInstanceSummary {
  return {
    id: row.layer_instance_id,
    sceneId: row.scene_id,
    layerTypeId: Number(row.layer_type_id),
    name: row.name,
    isEnabledDefault: Boolean(row.is_enabled_default),
    defaultOpacity: Number(row.default_opacity),
    config: typeof row.config === 'object' && row.config ? row.config : {},
  };
}

function toThermalGridCell(row: any): ThermalGridCell {
  return {
    cellId: Number(row.cell_id),
    gridX: Number(row.grid_x),
    gridY: Number(row.grid_y),
    gridZ: Number(row.grid_z),
    value: row.value === null ? null : Number(row.value),
    unit: row.unit ?? null,
  };
}

function toAirflowVector(row: any): AirflowVector {
  return {
    vectorId: Number(row.vector_id),
    origin: [Number(row.origin_x), Number(row.origin_y), Number(row.origin_z)],
    direction: [Number(row.direction_x), Number(row.direction_y), Number(row.direction_z)],
    magnitude: Number(row.magnitude_m_s),
    measuredAt: new Date(row.measured_at).toISOString(),
  };
}

function toPowerPathSummary(row: any): PowerPathSummary {
  return {
    pathId: Number(row.path_id),
    fromAssetId: row.from_asset_id,
    toAssetId: row.to_asset_id,
    connectionType: row.connection_type ?? null,
    pathGeom: row.path_geom ?? null,
  };
}
