import { Injectable } from '@nestjs/common';
import { ViewpointsQueryDto } from './dto/viewpoints-query.dto';
import { ViewpointRow, ViewpointSummary, ViewpointsResponse } from './viewer.types';
import { ViewerRepository } from './viewer.repository';

@Injectable()
export class ViewerService {
  constructor(private readonly repository: ViewerRepository) {}

  async listViewpoints(query: ViewpointsQueryDto): Promise<ViewpointsResponse> {
    const rows = await this.repository.listViewpoints(query);
    return { items: rows.map(toViewpointSummary) };
  }
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
