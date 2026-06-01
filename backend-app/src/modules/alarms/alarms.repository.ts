import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DbService } from '../../db/db.service';
import { AlarmsQueryDto } from './dto/alarms-query.dto';

export interface AlarmSummaryRow {
  alarm_id: string;
  raised_at: Date | string;
  severity: string;
  state: string;
  title: string;
  message: string | null;
  current_value: number | string | null;
  threshold_value: number | string | null;
  asset_id: string | null;
  asset_tag: string | null;
  asset_name: string | null;
  asset_category: string | null;
}

export interface AlarmDetailRow extends AlarmSummaryRow {
  rule_id: string | null;
  rule_code: string | null;
  rule_name: string | null;
  forecast_value: number | string | null;
  forecast_horizon_min: number | string | null;
  acked_by: string | null;
  acked_at: Date | string | null;
  assigned_to: string | null;
  assigned_at: Date | string | null;
  resolved_at: Date | string | null;
  resolution_note: string | null;
  location: unknown | null;
  nearest_camera_id: string | null;
  nearest_camera_tag: string | null;
  nearest_camera_name: string | null;
  nearest_camera_category: string | null;
  sop_id: string | null;
  sop_code: string | null;
  sop_title: string | null;
  sop_version: string | null;
  attributes: unknown;
}

export interface AlarmTimelineRow {
  event_id: string | number;
  occurred_at: Date | string;
  actor_id: string | null;
  event_type: string;
  payload: unknown;
}

@Injectable()
export class AlarmsRepository {
  constructor(private readonly dbService: DbService) {}
  private get db() { return this.dbService.db; }

  async listAlarms(query: AlarmsQueryDto): Promise<AlarmSummaryRow[]> {
    const limit = query.limit ?? 50;
    const result = await sql<AlarmSummaryRow>`
      SELECT
        al.alarm_id::text,
        al.raised_at,
        al.severity::text,
        al.state::text,
        al.title,
        al.message,
        al.current_value,
        al.threshold_value,
        a.asset_id::text,
        a.asset_tag,
        a.display_name AS asset_name,
        a.category_code AS asset_category
      FROM alarm.alarm al
      LEFT JOIN asset.asset a ON a.asset_id = al.asset_id
      WHERE (${query.status ?? null}::text IS NULL OR al.state::text = ${query.status ?? null})
        AND (${query.severity ?? null}::text IS NULL OR al.severity::text = ${query.severity ?? null})
        AND (${query.assetId ?? null}::uuid IS NULL OR al.asset_id = ${query.assetId ?? null}::uuid)
        AND (${query.from ?? null}::timestamptz IS NULL OR al.raised_at >= ${query.from ?? null}::timestamptz)
        AND (${query.to ?? null}::timestamptz IS NULL OR al.raised_at <= ${query.to ?? null}::timestamptz)
        AND (${query.cursor ?? null}::timestamptz IS NULL OR al.raised_at < ${query.cursor ?? null}::timestamptz)
      ORDER BY al.raised_at DESC
      LIMIT ${limit + 1}
    `.execute(this.db);
    return result.rows;
  }

  async getAlarm(alarmId: string): Promise<AlarmDetailRow | null> {
    const result = await sql<AlarmDetailRow>`
      SELECT
        al.alarm_id::text,
        al.raised_at,
        al.severity::text,
        al.state::text,
        al.title,
        al.message,
        al.current_value,
        al.threshold_value,
        al.forecast_value,
        al.forecast_horizon_min,
        al.acked_by::text,
        al.acked_at,
        al.assigned_to::text,
        al.assigned_at,
        al.resolved_at,
        al.resolution_note,
        ST_AsGeoJSON(al.geom)::json AS location,
        al.attributes,
        a.asset_id::text,
        a.asset_tag,
        a.display_name AS asset_name,
        a.category_code AS asset_category,
        ar.rule_id::text,
        ar.code AS rule_code,
        ar.name AS rule_name,
        cam.asset_id::text AS nearest_camera_id,
        cam.asset_tag AS nearest_camera_tag,
        cam.display_name AS nearest_camera_name,
        cam.category_code AS nearest_camera_category,
        sd.sop_id::text,
        sd.code AS sop_code,
        sd.title AS sop_title,
        sd.version AS sop_version
      FROM alarm.alarm al
      LEFT JOIN asset.asset a ON a.asset_id = al.asset_id
      LEFT JOIN alarm.alarm_rule ar ON ar.rule_id = al.rule_id
      LEFT JOIN asset.asset cam ON cam.asset_id = al.nearest_camera_id
      LEFT JOIN sop.sop_document sd ON sd.sop_id = ar.sop_id
      WHERE al.alarm_id = ${alarmId}
      ORDER BY al.raised_at DESC
      LIMIT 1
    `.execute(this.db);
    return result.rows[0] ?? null;
  }

  async getTimeline(alarmId: string): Promise<AlarmTimelineRow[]> {
    const result = await sql<AlarmTimelineRow>`
      SELECT
        event_id,
        occurred_at,
        actor_id::text,
        event_type::text,
        payload
      FROM alarm.alarm_event_log
      WHERE alarm_id = ${alarmId}
      ORDER BY occurred_at ASC, event_id ASC
    `.execute(this.db);
    return result.rows;
  }
}
