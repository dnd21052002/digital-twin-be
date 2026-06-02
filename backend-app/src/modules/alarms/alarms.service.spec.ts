import { NotFoundException } from '@nestjs/common';
import { AlarmsService } from './alarms.service';
import type { AlarmBasicRow, NearestCameraRow, SopDocumentRow, SopStepRow } from './alarms.repository';

describe('AlarmsService', () => {
  const fakeUserId = 'u-actor-001';
  function mockReq(): any {
    return { user: { id: fakeUserId, sessionId: 's', roles: [], permissions: [] } };
  }
  function basic(o?: Partial<AlarmBasicRow>): AlarmBasicRow {
    return { alarm_id: 'alm-001', state: 'new', rule_id: '42', asset_id: 'ast-001', zone_id: '7', ...o };
  }

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