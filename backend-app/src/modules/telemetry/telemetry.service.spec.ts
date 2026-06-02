import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import type { LatestMetricRow, TimeseriesMetricRow } from './telemetry.repository';

describe('TelemetryService', () => {
  function mockAssetExists(val: boolean) {
    return { assetExists: jest.fn().mockResolvedValue(val) };
  }

  // ── latestMetrics ──

  it('latestMetrics throws NotFound when asset missing', async () => {
    const r = mockAssetExists(false);
    const s = new TelemetryService(r as never);
    await expect(s.latestMetrics('bad-id')).rejects.toThrow(NotFoundException);
  });

  it('latestMetrics returns mapped rows', async () => {
    const rows: LatestMetricRow[] = [
      { asset_id: 'a', metric_key: 'temp_c', name: 'Temperature', unit: 'C', timestamp: '2026-01-01T00:00:00Z', value: '25.5', quality: '100' },
    ];
    const r = { assetExists: jest.fn().mockResolvedValue(true), latestMetrics: jest.fn().mockResolvedValue(rows) };
    const s = new TelemetryService(r as never);
    const res = await s.latestMetrics('a');
    expect(res).toEqual({
      assetId: 'a',
      items: [
        { metricKey: 'temp_c', name: 'Temperature', unit: 'C', value: 25.5, quality: 100, timestamp: new Date('2026-01-01T00:00:00Z').toISOString() },
      ],
    });
  });

  it('latestMetrics returns empty items when no data', async () => {
    const r = { assetExists: jest.fn().mockResolvedValue(true), latestMetrics: jest.fn().mockResolvedValue([]) };
    const s = new TelemetryService(r as never);
    await expect(s.latestMetrics('a')).resolves.toEqual({ assetId: 'a', items: [] });
  });

  // ── metricTimeseries ──

  it('metricTimeseries throws NotFound when asset missing', async () => {
    const r = mockAssetExists(false);
    const s = new TelemetryService(r as never);
    await expect(s.metricTimeseries('bad', { metric: 't', from: '2026-01-01T00:00:00Z', to: '2026-01-01T01:00:00Z' } as never)).rejects.toThrow(NotFoundException);
  });

  it('metricTimeseries throws BadRequest when from > to', async () => {
    const r = { assetExists: jest.fn().mockResolvedValue(true) };
    const s = new TelemetryService(r as never);
    await expect(s.metricTimeseries('a', { metric: 't', from: '2026-01-02T00:00:00Z', to: '2026-01-01T00:00:00Z' } as never)).rejects.toThrow(BadRequestException);
  });

  it('metricTimeseries returns mapped points', async () => {
    const rows: TimeseriesMetricRow[] = [
      { timestamp: '2026-01-01T00:00:00Z', value: '22', quality: '100', unit: 'C' },
      { timestamp: '2026-01-01T01:00:00Z', value: '23', quality: null, unit: 'C' },
    ];
    const r = {
      assetExists: jest.fn().mockResolvedValue(true),
      metricTimeseries: jest.fn().mockResolvedValue(rows),
    };
    const s = new TelemetryService(r as never);
    const res = await s.metricTimeseries('a', { metric: 'temp_c', from: '2026-01-01T00:00:00Z', to: '2026-01-01T01:00:00Z' } as never);
    expect(res).toMatchObject({
      assetId: 'a',
      metricKey: 'temp_c',
      unit: 'C',
      interval: null,
      points: [
        { value: 22, quality: 100 },
        { value: 23, quality: null },
      ],
    });
  });

  it('metricTimeseries empty rows returns null unit', async () => {
    const r = { assetExists: jest.fn().mockResolvedValue(true), metricTimeseries: jest.fn().mockResolvedValue([]) };
    const s = new TelemetryService(r as never);
    const res = await s.metricTimeseries('a', { metric: 't', from: '2026-01-01T00:00:00Z', to: '2026-01-01T01:00:00Z' } as never);
    expect(res.unit).toBeNull();
    expect(res.points).toEqual([]);
  });

  it('metricTimeseries passes interval to response', async () => {
    const r = { assetExists: jest.fn().mockResolvedValue(true), metricTimeseries: jest.fn().mockResolvedValue([{ timestamp: '2026-01-01T00:00:00Z', value: '1', quality: '100', unit: 'C' }]) };
    const s = new TelemetryService(r as never);
    const res = await s.metricTimeseries('a', { metric: 't', from: '2026-01-01T00:00:00Z', to: '2026-01-01T01:00:00Z', interval: '1m' } as never);
    expect(res.interval).toBe('1m');
  });
});
