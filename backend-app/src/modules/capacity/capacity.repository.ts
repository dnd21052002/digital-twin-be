import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DbService } from '../../db/db.service';
import { CapacitySummaryQueryDto } from './dto/capacity-query.dto';
import { PlacementRecommendationRequestDto } from './dto/capacity-request.dto';
import { CapacitySnapshotRow, PlacementRecommendationRow, PlacementScoreDetailRow } from './capacity.types';

@Injectable()
export class CapacityRepository {
  constructor(private readonly dbService: DbService) {}
  private get db() { return this.dbService.db; }

  async latestSnapshots(query: CapacitySummaryQueryDto): Promise<CapacitySnapshotRow[]> {
    let filter = sql`TRUE`;
    if (query.siteId) filter = sql`${filter} AND b.site_id = ${query.siteId}::bigint`;
    if (query.floorId) filter = sql`${filter} AND f.floor_id = ${query.floorId}::bigint`;
    if (query.hallId) filter = sql`${filter} AND h.hall_id = ${query.hallId}::bigint`;
    if (query.zoneId) filter = sql`${filter} AND cs.zone_id = ${query.zoneId}::bigint`;

    const r = await sql<CapacitySnapshotRow>`
      SELECT DISTINCT ON (cs.zone_id)
        cs.zone_id::text AS zone_id,
        cs.power_total_kw,
        cs.power_used_kw,
        cs.power_available_kw,
        cs.cooling_total_kw,
        cs.cooling_used_kw,
        cs.cooling_available_kw,
        cs.space_total_u,
        cs.space_used_u,
        cs.space_available_u
      FROM capacity.capacity_snapshot cs
      JOIN facility.zone z ON z.zone_id = cs.zone_id
      JOIN facility.hall h ON h.hall_id = z.hall_id
      JOIN facility.floor f ON f.floor_id = h.floor_id
      JOIN facility.building b ON b.building_id = f.building_id
      WHERE ${filter}
      ORDER BY cs.zone_id, cs.taken_at DESC
    `.execute(this.db);
    return r.rows;
  }

  async createRecommendation(
    userId: string,
    dto: PlacementRecommendationRequestDto,
  ): Promise<PlacementRecommendationRow> {
    const r = await sql<PlacementRecommendationRow>`
      INSERT INTO capacity.placement_recommendation
        (requested_by, scope_site_id, requirement_json, status)
      VALUES (
        ${userId},
        ${dto.siteId}::bigint,
        ${JSON.stringify({ powerKw: dto.requiredKw, coolingKw: dto.requiredCoolingKw, heightU: dto.rackUnits, redundancy: dto.redundancy })},
        'computed'
      )
      RETURNING recommendation_id
    `.execute(this.db);
    return r.rows[0];
  }

  async insertScoreDetails(
    recommendationId: string,
    items: { rackPosId: number; score: number; reasons: string[] }[],
  ): Promise<void> {
    for (const item of items) {
      await sql`
        INSERT INTO capacity.placement_score_detail
          (recommendation_id, rack_pos_id, total_score, reasoning_text)
        VALUES (
          ${recommendationId},
          ${item.rackPosId},
          ${item.score},
          ${item.reasons.join(', ')}
        )
      `.execute(this.db);
    }
  }

  async fetchScoreDetails(recommendationId: string): Promise<PlacementScoreDetailRow[]> {
    const r = await sql<PlacementScoreDetailRow>`
      SELECT
        rack_pos_id::text AS rack_pos_id,
        total_score,
        reasoning_text
      FROM capacity.placement_score_detail
      WHERE recommendation_id = ${recommendationId}
      ORDER BY total_score DESC
    `.execute(this.db);
    return r.rows;
  }

  async findAvailableRackPositions(siteId: string): Promise<{ rack_pos_id: number }[]> {
    const r = await sql<{ rack_pos_id: number }>`
      SELECT rp.rack_pos_id
      FROM facility.rack_position rp
      JOIN facility."row" r ON r.row_id = rp.row_id
      JOIN facility.hall h ON h.hall_id = r.hall_id
      JOIN facility.floor f ON f.floor_id = h.floor_id
      JOIN facility.building b ON b.building_id = f.building_id
      WHERE b.site_id = ${siteId}::bigint
        AND rp.current_rack_id IS NULL
      ORDER BY rp.rack_pos_id
      LIMIT 10
    `.execute(this.db);
    return r.rows;
  }
}
