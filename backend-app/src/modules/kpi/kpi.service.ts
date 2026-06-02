import { Injectable } from '@nestjs/common';
import { KpiTimeseriesQueryDto } from './dto/kpi-query.dto';
import { KpiRepository } from './kpi.repository';
import { KpiLatestItem, KpiLatestResponse, KpiTimeseriesItem, KpiTimeseriesPoint, KpiTimeseriesResponse } from './kpi.types';

@Injectable()
export class KpiService {
  constructor(private readonly repo: KpiRepository) {}

  async latest(): Promise<KpiLatestResponse> {
    const [defs, samples] = await Promise.all([this.repo.listDefinitions(), this.repo.latestSamplePerKpi()]);
    const defMap = new Map(defs.map((d) => [d.kpi_id, d]));
    const items: KpiLatestItem[] = [];
    for (const s of samples) {
      const def = defMap.get(s.kpi_id);
      if (!def) continue;
      items.push({
        kpiId: s.kpi_id,
        code: def.code,
        name: def.name,
        value: s.value,
        unit: def.unit_code,
        targetValue: def.target_value,
        timestamp: s.time.toISOString(),
      });
    }
    return { items };
  }

  async timeseries(query: KpiTimeseriesQueryDto): Promise<KpiTimeseriesResponse> {
    const rows = await this.repo.timeseries(query);
    const defs = await this.repo.listDefinitions();
    const defMap = new Map(defs.map((d) => [d.kpi_id, d]));
    const grouped = new Map<string, KpiTimeseriesPoint[]>();
    for (const r of rows) {
      const pts = grouped.get(r.kpi_id) ?? [];
      pts.push({ timestamp: r.time.toISOString(), value: r.value });
      grouped.set(r.kpi_id, pts);
    }
    const items: KpiTimeseriesItem[] = [];
    for (const [kpiId, points] of grouped) {
      const def = defMap.get(kpiId);
      items.push({ kpiId, code: def?.code ?? '', points });
    }
    return { items };
  }
}
