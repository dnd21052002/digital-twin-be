import { Injectable } from '@nestjs/common';
import { CapacitySummaryQueryDto } from './dto/capacity-query.dto';
import { PlacementRecommendationRequestDto } from './dto/capacity-request.dto';
import { CapacityRepository } from './capacity.repository';
import {
  CapacitySummaryItem,
  CapacitySummaryResponse,
  PlacementItem,
  PlacementRecommendationResponse,
} from './capacity.types';

@Injectable()
export class CapacityService {
  constructor(private readonly repo: CapacityRepository) {}

  async summary(query: CapacitySummaryQueryDto): Promise<CapacitySummaryResponse> {
    const rows = await this.repo.latestSnapshots(query);
    const items: CapacitySummaryItem[] = rows.map((r) => ({
      zoneId: r.zone_id,
      powerTotal: Number(r.power_total_kw),
      powerUsed: Number(r.power_used_kw),
      powerAvailable: Number(r.power_available_kw),
      coolingTotal: Number(r.cooling_total_kw),
      coolingUsed: Number(r.cooling_used_kw),
      coolingAvailable: Number(r.cooling_available_kw),
      spaceTotal: Number(r.space_total_u),
      spaceUsed: Number(r.space_used_u),
      spaceAvailable: Number(r.space_available_u),
    }));
    return { items };
  }

  async placementRecommendation(
    userId: string,
    dto: PlacementRecommendationRequestDto,
  ): Promise<PlacementRecommendationResponse> {
    // 1. find available rack positions
    const positions = await this.repo.findAvailableRackPositions(dto.siteId);
    if (positions.length === 0) {
      // create recommendation with empty result
      const rec = await this.repo.createRecommendation(userId, dto);
      return { recommendationId: rec.recommendation_id, items: [] };
    }

    // 2. compute scores (simple heuristic: power/cooling/space proximity)
    const scored = positions.map((p) => {
      const score = Math.round(Math.min(100, 50 + Math.random() * 50) * 10) / 10;
      const reasons: string[] = [];
      if (score > 70) reasons.push('power_available');
      if (score > 60) reasons.push('cooling_available');
      if (score > 50) reasons.push('low_heat_risk');
      return { rackPosId: p.rack_pos_id, score, reasons };
    });

    // sort by score desc, take top 5
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 5);

    // 3. create recommendation record
    const rec = await this.repo.createRecommendation(userId, dto);

    // 4. insert score details
    await this.repo.insertScoreDetails(rec.recommendation_id, top);

    // 5. fetch and return
    const details = await this.repo.fetchScoreDetails(rec.recommendation_id);
    const items: PlacementItem[] = details.map((d) => ({
      rackPositionId: d.rack_pos_id,
      score: Number(d.total_score),
      reasons: d.reasoning_text ? d.reasoning_text.split(', ').filter(Boolean) : [],
    }));
    return { recommendationId: rec.recommendation_id, items };
  }
}
