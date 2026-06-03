import { Injectable } from '@nestjs/common';
import { ViewpointsQueryDto } from './dto/viewpoints-query.dto';
import { CreateViewPresetDto } from './dto/create-view-preset.dto';
import { ViewpointRow, ViewpointSummary, ViewpointsResponse, ViewPresetRow, ViewPresetResponse } from './viewer.types';
import { ViewerRepository } from './viewer.repository';

@Injectable()
export class ViewerService {
  constructor(private readonly repository: ViewerRepository) {}

  async listViewpoints(query: ViewpointsQueryDto): Promise<ViewpointsResponse> {
    const rows = await this.repository.listViewpoints(query);
    return { items: rows.map(toViewpointSummary) };
  }

  async createViewPreset(userId: string, dto: CreateViewPresetDto): Promise<ViewPresetResponse> {
    const row = await this.repository.createViewPreset(userId, dto);
    return toViewPresetResponse(row);
  }
}

function toViewPresetResponse(row: ViewPresetRow): ViewPresetResponse {
  return {
    id: row.preset_id,
    name: row.name,
    userId: row.user_id,
    sceneId: row.scene_id,
    createdAt: row.created_at.toISOString(),
  };
}

function toViewpointSummary(row: ViewpointRow): ViewpointSummary {
  return {
    id: row.id,
    sceneId: row.scene_id,
    name: row.name,
    type: row.type,
    target: toObject(row.target),
    camera: toObject(row.camera),
    sortOrder: row.sort_order === null ? null : Number(row.sort_order),
  };
}

function toObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}
