import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { AlarmDetailRow, AlarmsRepository, AlarmSummaryRow, AlarmTimelineRow } from './alarms.repository';
import {
  AlarmDetail, AlarmListResponse, AlarmSummary, AlarmTimelineEvent,
  NearestCamerasResponse, NearestCamera, SopResponse, SopDocument, SopStep,
} from './alarms.types';
import { AlarmsQueryDto } from './dto/alarms-query.dto';

@Injectable()
export class AlarmsService {
  constructor(private readonly repository: AlarmsRepository) {}

  async listAlarms(query: AlarmsQueryDto): Promise<AlarmListResponse> {
    if (query.from && query.to && new Date(query.from) > new Date(query.to)) {
      throw new BadRequestException('from must be before or equal to to');
    }
    const limit = query.limit ?? 50;
    const rows = await this.repository.listAlarms(query);
    const pageRows = rows.slice(0, limit);
    const items = pageRows.map(toSummary);
    return {
      items,
      nextCursor: rows.length > limit ? items[items.length - 1]?.raisedAt ?? null : null,
    };
  }

  async getAlarm(alarmId: string): Promise<AlarmDetail> {
    const row = await this.repository.getAlarm(alarmId);
    if (!row) throw new NotFoundException('Alarm not found');
    const timeline = await this.repository.getTimeline(alarmId);
    return toDetail(row, timeline);
  }

  async acknowledgeAlarm(alarmId: string, comment: string | undefined, req: Request): Promise<{ ok: true }> {
    const row = await this.repository.getAlarmBasic(alarmId);
    if (!row) throw new NotFoundException('Alarm not found');
    const actorId = req.user!.id;
    await this.repository.acknowledgeAlarm(alarmId, actorId, comment ?? null);
    return { ok: true };
  }

  async assignAlarm(alarmId: string, assigneeUserId: string, req: Request): Promise<{ ok: true }> {
    const row = await this.repository.getAlarmBasic(alarmId);
    if (!row) throw new NotFoundException('Alarm not found');
    const actorId = req.user!.id;
    await this.repository.assignAlarm(alarmId, actorId, assigneeUserId);
    return { ok: true };
  }

  async resolveAlarm(alarmId: string, resolution: string, req: Request): Promise<{ ok: true }> {
    const row = await this.repository.getAlarmBasic(alarmId);
    if (!row) throw new NotFoundException('Alarm not found');
    const actorId = req.user!.id;
    await this.repository.resolveAlarm(alarmId, actorId, resolution);
    return { ok: true };
  }

  async getNearestCameras(alarmId: string): Promise<NearestCamerasResponse> {
    const row = await this.repository.getAlarmBasic(alarmId);
    if (!row) throw new NotFoundException('Alarm not found');
    if (!row.zone_id) return { items: [] };
    const rows = await this.repository.getNearestCameras(row.zone_id);
    return { items: rows.map(toNearestCamera) };
  }

  async getSop(alarmId: string): Promise<SopResponse> {
    const row = await this.repository.getAlarmBasic(alarmId);
    if (!row) throw new NotFoundException('Alarm not found');
    if (!row.rule_id) throw new NotFoundException('Alarm has no rule');
    // Look up rule to get sop_id
    const alarmRow = await this.repository.getAlarm(alarmId);
    if (!alarmRow?.sop_id) throw new NotFoundException('Alarm rule has no SOP');
    const doc = await this.repository.getSopDocument(alarmRow.sop_id);
    if (!doc) throw new NotFoundException('SOP not found');
    const steps = await this.repository.getSopSteps(alarmRow.sop_id);
    return { sop: toSopDocument(doc), steps: steps.map(toSopStep) };
  }
}

function toNearestCamera(row: import('./alarms.repository').NearestCameraRow): NearestCamera {
  return {
    cameraId: row.camera_id,
    name: row.display_name,
    streamUrl: row.stream_url ?? '',
    coveragePct: Number(row.coverage_pct),
    priority: Number(row.priority),
  };
}

function toSopDocument(row: import('./alarms.repository').SopDocumentRow): SopDocument {
  return { id: row.sop_id, code: row.code, title: row.title, summary: row.summary };
}

function toSopStep(row: import('./alarms.repository').SopStepRow): SopStep {
  return {
    stepNumber: Number(row.step_number),
    instruction: row.instruction,
    expectedOutcome: row.expected_outcome,
    requiresRole: row.requires_role,
    estimatedMinutes: row.estimated_minutes === null ? null : Number(row.estimated_minutes),
  };
}

function toSummary(row: AlarmSummaryRow): AlarmSummary {
  return {
    id: row.alarm_id,
    raisedAt: new Date(row.raised_at).toISOString(),
    severity: row.severity,
    state: row.state,
    title: row.title,
    message: row.message,
    currentValue: toNumberOrNull(row.current_value),
    thresholdValue: toNumberOrNull(row.threshold_value),
    asset: row.asset_id ? {
      id: row.asset_id,
      assetTag: row.asset_tag ?? '',
      name: row.asset_name ?? '',
      category: row.asset_category ?? '',
    } : null,
  };
}

function toDetail(row: AlarmDetailRow, timeline: AlarmTimelineRow[]): AlarmDetail {
  return {
    ...toSummary(row),
    rule: row.rule_id ? { id: row.rule_id, code: row.rule_code ?? '', name: row.rule_name ?? '' } : null,
    forecastValue: toNumberOrNull(row.forecast_value),
    forecastHorizonMin: toNumberOrNull(row.forecast_horizon_min),
    ackedBy: row.acked_by,
    ackedAt: toIsoOrNull(row.acked_at),
    assignedTo: row.assigned_to,
    assignedAt: toIsoOrNull(row.assigned_at),
    resolvedAt: toIsoOrNull(row.resolved_at),
    resolutionNote: row.resolution_note,
    location: row.location,
    nearestCamera: row.nearest_camera_id ? {
      id: row.nearest_camera_id,
      assetTag: row.nearest_camera_tag ?? '',
      name: row.nearest_camera_name ?? '',
      category: row.nearest_camera_category ?? '',
    } : null,
    sop: row.sop_id ? { id: row.sop_id, code: row.sop_code ?? '', title: row.sop_title ?? '', version: row.sop_version ?? '' } : null,
    attributes: row.attributes,
    timeline: timeline.map(toTimelineEvent),
  };
}

function toTimelineEvent(row: AlarmTimelineRow): AlarmTimelineEvent {
  return {
    id: String(row.event_id),
    occurredAt: new Date(row.occurred_at).toISOString(),
    actorId: row.actor_id,
    eventType: row.event_type,
    payload: row.payload,
  };
}

function toNumberOrNull(value: number | string | null): number | null {
  return value === null ? null : Number(value);
}

function toIsoOrNull(value: Date | string | null): string | null {
  return value === null ? null : new Date(value).toISOString();
}
