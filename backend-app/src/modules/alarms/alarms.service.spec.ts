import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AlarmsService } from './alarms.service';
import type { AlarmBasicRow, AlarmSummaryRow, NearestCameraRow, SopDocumentRow, SopStepRow } from './alarms.repository';

describe('AlarmsService', () => {
  const fakeUserId = 'u-actor-001';
  function mockReq(): any {
    return { user: { id: fakeUserId, sessionId: 's', roles: [], permissions: [] } };
  }
  function basic(o?: Partial<AlarmBasicRow>): AlarmBasicRow {
    return { alarm_id: 'alm-001', state: 'new', rule_id: '42', asset_id: 'ast-001', zone_id: '7', ...o };
  }
  function makeSummaryRow(alarmId: string, raisedAt: string): AlarmSummaryRow {
    return {
      alarm_id: alarmId, raised_at: raisedAt, severity: 'warning', state: 'new',
      title: 'Test Alarm', message: null, current_value: null, threshold_value: null,
      asset_id: null, asset_tag: null, asset_name: null, asset_category: null,
    };
  }

  // ── listAlarms (Sprint 1) ──

  it('listAlarms throws BadRequest when from > to', async () => {
    const r = {};
    const s = new AlarmsService(r as never);
    await expect(s.listAlarms({ from: '2026-01-02T00:00:00Z', to: '2026-01-01T00:00:00Z' } as never)).rejects.toThrow(BadRequestException);
  });

  it('listAlarms returns paginated items with nextCursor', async () => {
    const rows = [makeSummaryRow('a1', '2026-01-03T00:00:00Z'), makeSummaryRow('a2', '2026-01-02T00:00:00Z'), makeSummaryRow('a3', '2026-01-01T00:00:00Z')];
    const r = { listAlarms: jest.fn().mockResolvedValue(rows) };
    const s = new AlarmsService(r as never);
    const res = await s.listAlarms({ limit: 2 } as never);
    expect(res.items).toHaveLength(2);
    expect(res.nextCursor).toBe(new Date(rows[1].raised_at).toISOString());
  });

  it('listAlarms returns nextCursor null when fewer rows than limit', async () => {
    const rows = [makeSummaryRow('a1', '2026-01-01T00:00:00Z')];
    const r = { listAlarms: jest.fn().mockResolvedValue(rows) };
    const s = new AlarmsService(r as never);
    const res = await s.listAlarms({ limit: 5 } as never);
    expect(res.items).toHaveLength(1);
    expect(res.nextCursor).toBeNull();
  });

  it('listAlarms returns nextCursor null when no items', async () => {
    const r = { listAlarms: jest.fn().mockResolvedValue([]) };
    const s = new AlarmsService(r as never);
    const res = await s.listAlarms({ limit: 5 } as never);
    expect(res.items).toEqual([]);
    expect(res.nextCursor).toBeNull();
  });

  it('listAlarms uses default limit of 50', async () => {
    const rows = Array.from({ length: 60 }, (_, i) => {
      const d = new Date('2026-01-28T00:00:00Z');
      d.setMinutes(d.getMinutes() + i);
      return makeSummaryRow(`a${i}`, d.toISOString());
    });
    const r = { listAlarms: jest.fn().mockResolvedValue(rows) };
    const s = new AlarmsService(r as never);
    const res = await s.listAlarms({} as never);
    expect(res.items).toHaveLength(50);
    expect(res.nextCursor).toBeTruthy();
  });

  it('listAlarms maps asset fields when present', async () => {
    const row: AlarmSummaryRow = { alarm_id: 'a1', raised_at: '2026-01-01T00:00:00Z', severity: 'error', state: 'new', title: 'T', message: 'M', current_value: '12.5', threshold_value: '10.0', asset_id: 'ast-001', asset_tag: 'TAG-001', asset_name: 'Asset One', asset_category: 'server' };
    const r = { listAlarms: jest.fn().mockResolvedValue([row]) };
    const s = new AlarmsService(r as never);
    const res = await s.listAlarms({ limit: 5 } as never);
    expect(res.items[0]).toMatchObject({ id: 'a1', severity: 'error', currentValue: 12.5, thresholdValue: 10.0, asset: { id: 'ast-001', assetTag: 'TAG-001', name: 'Asset One', category: 'server' } });
  });

  it('listAlarms maps null asset correctly', async () => {
    const row = makeSummaryRow('a1', '2026-01-01T00:00:00Z');
    const r = { listAlarms: jest.fn().mockResolvedValue([row]) };
    const s = new AlarmsService(r as never);
    const res = await s.listAlarms({ limit: 5 } as never);
    expect(res.items[0].asset).toBeNull();
  });

  // ── getAlarm (Sprint 1) ──

  it('getAlarm throws NotFound when missing', async () => {
    const r = { getAlarm: jest.fn().mockResolvedValue(null) };
    const s = new AlarmsService(r as never);
    await expect(s.getAlarm('bad')).rejects.toThrow(NotFoundException);
  });

  it('getAlarm returns detail with timeline', async () => {
    const detailRow = {
      alarm_id: 'a1', raised_at: '2026-01-01T00:00:00Z', severity: 'critical', state: 'new',
      title: 'Fire', message: 'Fire detected', current_value: '99.9', threshold_value: '80.0',
      asset_id: 'ast-001', asset_tag: 'TAG', asset_name: 'A', asset_category: 'sensor',
      rule_id: 'r1', rule_code: 'FIRE', rule_name: 'Fire Rule',
      forecast_value: null, forecast_horizon_min: null,
      acked_by: null, acked_at: null, assigned_to: null, assigned_at: null,
      resolved_at: null, resolution_note: null,
      location: { type: 'Point', coordinates: [1, 2] },
      nearest_camera_id: null, nearest_camera_tag: null, nearest_camera_name: null, nearest_camera_category: null,
      sop_id: null, sop_code: null, sop_title: null, sop_version: null,
      attributes: { severity: 5 },
    };
    const timelineRows = [{ event_id: '1', occurred_at: '2026-01-01T00:01:00Z', actor_id: 'u-1', event_type: 'raised', payload: {} }];
    const r = { getAlarm: jest.fn().mockResolvedValue(detailRow), getTimeline: jest.fn().mockResolvedValue(timelineRows) };
    const s = new AlarmsService(r as never);
    const res = await s.getAlarm('a1');
    expect(res).toMatchObject({ id: 'a1', severity: 'critical', state: 'new', rule: { id: 'r1', code: 'FIRE', name: 'Fire Rule' }, location: { type: 'Point' }, attributes: { severity: 5 } });
    expect(res.timeline).toHaveLength(1);
  });

  // ── Action-based tests (Sprint 2) ──

  it('acknowledgeAlarm throws when missing', async () => {
    const r = { getAlarmBasic: jest.fn().mockResolvedValue(null) };
    const s = new AlarmsService(r as never);
    await expect(s.acknowledgeAlarm('bad', undefined, mockReq())).rejects.toThrow(NotFoundException);
  });

  it('acknowledgeAlarm calls repo', async () => {
    const r = { getAlarmBasic: jest.fn().mockResolvedValue(basic()), acknowledgeAlarm: jest.fn() };
    const s = new AlarmsService(r as never);
    expect(await s.acknowledgeAlarm('alm-001', 'comment', mockReq())).toEqual({ ok: true });
    expect(r.acknowledgeAlarm).toHaveBeenCalledWith('alm-001', fakeUserId, 'comment');
  });

  it('acknowledgeAlarm null comment', async () => {
    const r = { getAlarmBasic: jest.fn().mockResolvedValue(basic()), acknowledgeAlarm: jest.fn() };
    const s = new AlarmsService(r as never);
    await s.acknowledgeAlarm('alm-001', undefined, mockReq());
    expect(r.acknowledgeAlarm).toHaveBeenCalledWith('alm-001', fakeUserId, null);
  });

  it('assignAlarm throws when missing', async () => {
    const r = { getAlarmBasic: jest.fn().mockResolvedValue(null) };
    const s = new AlarmsService(r as never);
    await expect(s.assignAlarm('bad', 'aid', mockReq())).rejects.toThrow(NotFoundException);
  });

  it('assignAlarm calls repo', async () => {
    const r = { getAlarmBasic: jest.fn().mockResolvedValue(basic()), assignAlarm: jest.fn() };
    const s = new AlarmsService(r as never);
    expect(await s.assignAlarm('alm-001', 'assignee', mockReq())).toEqual({ ok: true });
    expect(r.assignAlarm).toHaveBeenCalledWith('alm-001', fakeUserId, 'assignee');
  });

  it('resolveAlarm throws when missing', async () => {
    const r = { getAlarmBasic: jest.fn().mockResolvedValue(null) };
    const s = new AlarmsService(r as never);
    await expect(s.resolveAlarm('bad', 'fix', mockReq())).rejects.toThrow(NotFoundException);
  });

  it('resolveAlarm calls repo', async () => {
    const r = { getAlarmBasic: jest.fn().mockResolvedValue(basic()), resolveAlarm: jest.fn() };
    const s = new AlarmsService(r as never);
    expect(await s.resolveAlarm('alm-001', 'Fixed', mockReq())).toEqual({ ok: true });
    expect(r.resolveAlarm).toHaveBeenCalledWith('alm-001', fakeUserId, 'Fixed');
  });

  it('getNearestCameras throws when missing', async () => {
    const r = { getAlarmBasic: jest.fn().mockResolvedValue(null) };
    const s = new AlarmsService(r as never);
    await expect(s.getNearestCameras('bad')).rejects.toThrow(NotFoundException);
  });

  it('getNearestCameras empty when no zone', async () => {
    const r = { getAlarmBasic: jest.fn().mockResolvedValue(basic({ zone_id: null })) };
    const s = new AlarmsService(r as never);
    expect(await s.getNearestCameras('alm-001')).toEqual({ items: [] });
  });

  it('getNearestCameras maps rows', async () => {
    const rows: NearestCameraRow[] = [
      { camera_id: 'cam-1', display_name: 'Cam 1', stream_url: 'rtsp://c1', coverage_pct: '80', priority: 1 },
    ];
    const r = { getAlarmBasic: jest.fn().mockResolvedValue(basic()), getNearestCameras: jest.fn().mockResolvedValue(rows) };
    const s = new AlarmsService(r as never);
    expect(await s.getNearestCameras('alm-001')).toEqual({
      items: [{ cameraId: 'cam-1', name: 'Cam 1', streamUrl: 'rtsp://c1', coveragePct: 80, priority: 1 }],
    });
  });

  it('getSop throws when missing', async () => {
    const r = { getAlarmBasic: jest.fn().mockResolvedValue(null) };
    const s = new AlarmsService(r as never);
    await expect(s.getSop('bad')).rejects.toThrow(NotFoundException);
  });

  it('getSop throws when no rule_id', async () => {
    const r = { getAlarmBasic: jest.fn().mockResolvedValue(basic({ rule_id: null })) };
    const s = new AlarmsService(r as never);
    await expect(s.getSop('alm-001')).rejects.toThrow(NotFoundException);
  });

  it('getSop throws when no sop_id', async () => {
    const r = { getAlarmBasic: jest.fn().mockResolvedValue(basic()), getAlarm: jest.fn().mockResolvedValue({ sop_id: null }) };
    const s = new AlarmsService(r as never);
    await expect(s.getSop('alm-001')).rejects.toThrow(NotFoundException);
  });

  it('getSop throws when doc missing', async () => {
    const r = {
      getAlarmBasic: jest.fn().mockResolvedValue(basic()),
      getAlarm: jest.fn().mockResolvedValue({ sop_id: 'sop-1' }),
      getSopDocument: jest.fn().mockResolvedValue(null),
    };
    const s = new AlarmsService(r as never);
    await expect(s.getSop('alm-001')).rejects.toThrow(NotFoundException);
  });

  it('getSop returns doc + steps', async () => {
    const doc: SopDocumentRow = { sop_id: 'sop-1', code: 'S', title: 'T', summary: 'Sum' };
    const steps: SopStepRow[] = [
      { step_number: 1, instruction: 'Do X', expected_outcome: 'OK', requires_role: 'OP', estimated_minutes: 5 },
    ];
    const r = {
      getAlarmBasic: jest.fn().mockResolvedValue(basic()),
      getAlarm: jest.fn().mockResolvedValue({ sop_id: 'sop-1' }),
      getSopDocument: jest.fn().mockResolvedValue(doc),
      getSopSteps: jest.fn().mockResolvedValue(steps),
    };
    const s = new AlarmsService(r as never);
    expect(await s.getSop('alm-001')).toEqual({
      sop: { id: 'sop-1', code: 'S', title: 'T', summary: 'Sum' },
      steps: [{ stepNumber: 1, instruction: 'Do X', expectedOutcome: 'OK', requiresRole: 'OP', estimatedMinutes: 5 }],
    });
  });
});