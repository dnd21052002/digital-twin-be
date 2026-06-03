# Sprint 2 Viewer Navigation Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four authenticated viewer navigation read APIs for rack positions, rack details, scene assets, and viewpoints.

**Architecture:** Follow existing NestJS controller/service/repository modules. Extend `facility` and `scenes`; add focused `racks` and `viewer` modules. Read current DB only; missing optional data returns `null` or `[]`.

**Tech Stack:** NestJS 10, Kysely raw SQL, class-validator, @nestjs/swagger, Jest e2e tests, PostgreSQL/PostGIS.

---

## File Structure

### Modify

- `backend-app/src/app.module.ts` — register `RacksModule` and `ViewerModule`.
- `backend-app/src/modules/facility/facility.controller.ts` — add `GET /facility/rack-positions` route.
- `backend-app/src/modules/facility/facility.repository.ts` — add filtered rack position query.
- `backend-app/src/modules/facility/facility.service.ts` — add pagination/mapping for rack positions.
- `backend-app/src/modules/facility/facility.types.ts` — add rack position list response types.
- `backend-app/src/modules/scenes/scenes.controller.ts` — add `GET /scenes/:sceneId/assets` route.
- `backend-app/src/modules/scenes/scenes.repository.ts` — add scene existence + scene asset query.
- `backend-app/src/modules/scenes/scenes.service.ts` — add scene asset response mapping.
- `backend-app/src/modules/scenes/scenes.types.ts` — add scene asset response types.
- `backend-app/src/modules/scenes/dto/scenes-response.dto.ts` — add scene asset Swagger DTOs.
- `backend-app/test/app.e2e-spec.ts` — add e2e and Swagger tests.

### Create

- `backend-app/src/modules/facility/dto/rack-positions-query.dto.ts` — query DTO.
- `backend-app/src/modules/facility/dto/rack-positions-response.dto.ts` — response DTO.
- `backend-app/src/modules/racks/racks.module.ts` — module wiring.
- `backend-app/src/modules/racks/racks.controller.ts` — `GET /racks/:rackId` route.
- `backend-app/src/modules/racks/racks.repository.ts` — rack detail SQL.
- `backend-app/src/modules/racks/racks.service.ts` — rack mapping + 404 handling.
- `backend-app/src/modules/racks/racks.types.ts` — rack response types.
- `backend-app/src/modules/racks/dto/racks-response.dto.ts` — Swagger response DTO.
- `backend-app/src/modules/viewer/viewer.module.ts` — module wiring.
- `backend-app/src/modules/viewer/viewer.controller.ts` — `GET /viewpoints` route.
- `backend-app/src/modules/viewer/viewer.repository.ts` — viewpoint SQL with missing-table fallback.
- `backend-app/src/modules/viewer/viewer.service.ts` — viewpoint mapping.
- `backend-app/src/modules/viewer/viewer.types.ts` — viewpoint response types.
- `backend-app/src/modules/viewer/dto/viewpoints-query.dto.ts` — query DTO.
- `backend-app/src/modules/viewer/dto/viewpoints-response.dto.ts` — Swagger response DTO.

---

## Task 1: Facility Rack Positions API

**Files:**
- Create: `backend-app/src/modules/facility/dto/rack-positions-query.dto.ts`
- Create: `backend-app/src/modules/facility/dto/rack-positions-response.dto.ts`
- Modify: `backend-app/src/modules/facility/facility.types.ts`
- Modify: `backend-app/src/modules/facility/facility.repository.ts`
- Modify: `backend-app/src/modules/facility/facility.service.ts`
- Modify: `backend-app/src/modules/facility/facility.controller.ts`
- Test: `backend-app/test/app.e2e-spec.ts`

- [ ] **Step 1: Add failing e2e test for rack position list**

Add this test after facility tree test in `backend-app/test/app.e2e-spec.ts`:

```ts
it('GET /api/v1/facility/rack-positions returns filtered rack positions', async () => {
  const token = await login();
  await request(app.getHttpServer())
    .get(`/api/v1/facility/rack-positions?siteId=${assetFixture.siteId}&limit=1`)
    .set('authorization', `Bearer ${token}`)
    .expect(200)
    .expect(({ body }) => {
      expect(body.nextCursor).toBeNull();
      expect(body.items).toHaveLength(1);
      expect(body.items[0]).toMatchObject({
        id: assetFixture.rackPositionId,
        code: 'E2E-RP1',
        positionIndex: 1,
        maxU: 42,
        maxPowerKw: 12.5,
        currentRackId: null,
        location: {
          siteId: assetFixture.siteId,
          buildingId: assetFixture.buildingId,
          floorId: assetFixture.floorId,
          hallId: assetFixture.hallId,
          zoneId: null,
          rowId: assetFixture.rowId,
        },
      });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run test:e2e -- --runInBand --testNamePattern='rack-positions'
```

Expected: FAIL with 404 for `/api/v1/facility/rack-positions`.

- [ ] **Step 3: Create query DTO**

Create `backend-app/src/modules/facility/dto/rack-positions-query.dto.ts`:

```ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RackPositionsQueryDto {
  limit?: number;
  cursor?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  buildingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  floorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hallId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rowId?: string;
}
```

- [ ] **Step 4: Create response DTO**

Create `backend-app/src/modules/facility/dto/rack-positions-response.dto.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';

export class RackPositionLocationDto {
  @ApiProperty({ nullable: true }) siteId!: string | null;
  @ApiProperty({ nullable: true }) buildingId!: string | null;
  @ApiProperty({ nullable: true }) floorId!: string | null;
  @ApiProperty({ nullable: true }) hallId!: string | null;
  @ApiProperty({ nullable: true }) zoneId!: string | null;
  @ApiProperty({ nullable: true }) rowId!: string | null;
}

export class RackPositionDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'A01' }) code!: string;
  @ApiProperty({ example: 1 }) positionIndex!: number;
  @ApiProperty({ nullable: true, example: 42 }) maxU!: number | null;
  @ApiProperty({ nullable: true, example: 12.5 }) maxPowerKw!: number | null;
  @ApiProperty({ nullable: true }) currentRackId!: string | null;
  @ApiProperty({ type: RackPositionLocationDto }) location!: RackPositionLocationDto;
}

export class RackPositionsResponseDto {
  @ApiProperty({ type: [RackPositionDto] }) items!: RackPositionDto[];
  @ApiProperty({ nullable: true }) nextCursor!: string | null;
}
```

- [ ] **Step 5: Add facility types**

Append to `backend-app/src/modules/facility/facility.types.ts`:

```ts
export interface RackPositionLocation {
  siteId: string | null;
  buildingId: string | null;
  floorId: string | null;
  hallId: string | null;
  zoneId: string | null;
  rowId: string | null;
}

export interface RackPositionSummary {
  id: string;
  code: string;
  positionIndex: number;
  maxU: number | null;
  maxPowerKw: number | null;
  currentRackId: string | null;
  location: RackPositionLocation;
}

export interface RackPositionsResponse {
  items: RackPositionSummary[];
  nextCursor: string | null;
}
```

- [ ] **Step 6: Add repository query**

Add imports in `backend-app/src/modules/facility/facility.repository.ts`:

```ts
import { RackPositionsQueryDto } from './dto/rack-positions-query.dto';
```

Add interface near `FacilityTreeRow`:

```ts
export interface RackPositionListRow {
  rack_pos_id: string;
  rack_pos_code: string;
  rack_pos_position_index: number | string;
  rack_pos_max_u: number | string | null;
  rack_pos_max_power_kw: number | string | null;
  rack_pos_current_rack_id: string | null;
  site_id: string | null;
  building_id: string | null;
  floor_id: string | null;
  hall_id: string | null;
  zone_id: string | null;
  row_id: string | null;
}
```

Add method in `FacilityRepository`:

```ts
async listRackPositions(query: RackPositionsQueryDto): Promise<RackPositionListRow[]> {
  const limit = query.limit ?? 50;
  const result = await sql<RackPositionListRow>`
    SELECT
      rp.rack_pos_id::text AS rack_pos_id,
      rp.code AS rack_pos_code,
      rp.position_index AS rack_pos_position_index,
      rp.max_u AS rack_pos_max_u,
      rp.max_power_kw AS rack_pos_max_power_kw,
      rp.current_rack_id::text AS rack_pos_current_rack_id,
      s.site_id::text AS site_id,
      b.building_id::text AS building_id,
      f.floor_id::text AS floor_id,
      h.hall_id::text AS hall_id,
      NULL::text AS zone_id,
      r.row_id::text AS row_id
    FROM facility.rack_position rp
    JOIN facility.row r ON r.row_id = rp.row_id
    JOIN facility.hall h ON h.hall_id = r.hall_id
    JOIN facility.floor f ON f.floor_id = h.floor_id
    JOIN facility.building b ON b.building_id = f.building_id
    JOIN facility.site s ON s.site_id = b.site_id
    WHERE s.deleted_at IS NULL
      AND b.deleted_at IS NULL
      AND (${query.siteId ?? null}::text IS NULL OR s.site_id::text = ${query.siteId ?? null})
      AND (${query.buildingId ?? null}::text IS NULL OR b.building_id::text = ${query.buildingId ?? null})
      AND (${query.floorId ?? null}::text IS NULL OR f.floor_id::text = ${query.floorId ?? null})
      AND (${query.hallId ?? null}::text IS NULL OR h.hall_id::text = ${query.hallId ?? null})
      AND (${query.rowId ?? null}::text IS NULL OR r.row_id::text = ${query.rowId ?? null})
      AND (${query.cursor ?? null}::text IS NULL OR rp.rack_pos_id::text > ${query.cursor ?? null})
    ORDER BY rp.rack_pos_id::text ASC
    LIMIT ${limit + 1}
  `.execute(this.db);
  return result.rows;
}
```

- [ ] **Step 7: Add service mapping**

Modify imports in `backend-app/src/modules/facility/facility.service.ts`:

```ts
import { RackPositionsQueryDto } from './dto/rack-positions-query.dto';
import { RackPositionsResponse, RackPositionSummary } from './facility.types';
import { FacilityTreeRow, RackPositionListRow, FacilityRepository } from './facility.repository';
```

Add method inside `FacilityService`:

```ts
async listRackPositions(query: RackPositionsQueryDto): Promise<RackPositionsResponse> {
  const limit = query.limit ?? 50;
  const rows = await this.repository.listRackPositions(query);
  const pageRows = rows.slice(0, limit);
  const items = pageRows.map(toRackPositionSummary);
  return {
    items,
    nextCursor: rows.length > limit ? items[items.length - 1]?.id ?? null : null,
  };
}
```

Add mapper below existing helper functions:

```ts
function toRackPositionSummary(row: RackPositionListRow): RackPositionSummary {
  return {
    id: row.rack_pos_id,
    code: row.rack_pos_code,
    positionIndex: toNumber(row.rack_pos_position_index),
    maxU: toNumberOrNull(row.rack_pos_max_u),
    maxPowerKw: toNumberOrNull(row.rack_pos_max_power_kw),
    currentRackId: row.rack_pos_current_rack_id,
    location: {
      siteId: row.site_id,
      buildingId: row.building_id,
      floorId: row.floor_id,
      hallId: row.hall_id,
      zoneId: row.zone_id,
      rowId: row.row_id,
    },
  };
}
```

- [ ] **Step 8: Add controller route**

Modify imports in `backend-app/src/modules/facility/facility.controller.ts`:

```ts
import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { RackPositionsQueryDto } from './dto/rack-positions-query.dto';
import { RackPositionsResponseDto } from './dto/rack-positions-response.dto';
```

Add route below `getTree()`:

```ts
@Get('rack-positions')
@ApiBearerAuth('bearer')
@RequirePermissions('asset:read')
@ApiOperation({ summary: 'List rack positions for viewer navigation.' })
@ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 } })
@ApiQuery({ name: 'cursor', required: false, schema: { type: 'string' } })
@ApiQuery({ name: 'siteId', required: false, schema: { type: 'string' } })
@ApiQuery({ name: 'buildingId', required: false, schema: { type: 'string' } })
@ApiQuery({ name: 'floorId', required: false, schema: { type: 'string' } })
@ApiQuery({ name: 'hallId', required: false, schema: { type: 'string' } })
@ApiQuery({ name: 'zoneId', required: false, schema: { type: 'string' } })
@ApiQuery({ name: 'rowId', required: false, schema: { type: 'string' } })
@ApiOkResponse({ type: RackPositionsResponseDto })
@ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
@ApiForbiddenResponse({ type: ApiErrorResponseDto })
listRackPositions(
  @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  @Query('cursor') cursor?: string,
  @Query('siteId') siteId?: string,
  @Query('buildingId') buildingId?: string,
  @Query('floorId') floorId?: string,
  @Query('hallId') hallId?: string,
  @Query('zoneId') zoneId?: string,
  @Query('rowId') rowId?: string,
) {
  return this.facility.listRackPositions({ limit, cursor, siteId, buildingId, floorId, hallId, zoneId, rowId });
}
```

- [ ] **Step 9: Run test to verify it passes**

Run:

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run test:e2e -- --runInBand --testNamePattern='rack-positions'
```

Expected: PASS.

- [ ] **Step 10: Commit Task 1**

```bash
git -C /Users/ndiepdev/Developer/twin-database/backend add backend-app/src/modules/facility backend-app/test/app.e2e-spec.ts
git -C /Users/ndiepdev/Developer/twin-database/backend commit -m "feat(facility): add rack position list"
```

---

## Task 2: Rack Detail API

**Files:**
- Create: `backend-app/src/modules/racks/racks.module.ts`
- Create: `backend-app/src/modules/racks/racks.controller.ts`
- Create: `backend-app/src/modules/racks/racks.repository.ts`
- Create: `backend-app/src/modules/racks/racks.service.ts`
- Create: `backend-app/src/modules/racks/racks.types.ts`
- Create: `backend-app/src/modules/racks/dto/racks-response.dto.ts`
- Modify: `backend-app/src/app.module.ts`
- Test: `backend-app/test/app.e2e-spec.ts`

- [ ] **Step 1: Add failing e2e tests for rack detail**

In `beforeAll`, after asset fixture insertion, add rack asset fixture variable support by changing the fixture type:

```ts
let assetFixture: { assetId: string; rackAssetId: string; siteId: string; buildingId: string; floorId: string; hallId: string; zoneId: string; rowId: string; rackPositionId: string };
```

After the existing asset insert, insert a rack asset:

```ts
const rackAsset = await sql<{ asset_id: string }>`
  INSERT INTO asset.asset (asset_id, asset_tag, display_name, category_code, model_id, serial_no, rack_pos_id, hall_id, zone_id, rotation_deg, status, attributes, deleted_at)
  VALUES ('33333333-3333-4333-8333-333333333333', 'E2E-RACK-001', 'E2E Rack One', 'e2e-server', ${model.rows[0].model_id}, 'SN-RACK-001', ${rackPosition.rows[0].rack_pos_id}, ${hall.rows[0].hall_id}, ${zone.rows[0].zone_id}, 0, 'online', '{"kind":"rack"}'::jsonb, NULL)
  ON CONFLICT (asset_tag) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      category_code = EXCLUDED.category_code,
      model_id = EXCLUDED.model_id,
      serial_no = EXCLUDED.serial_no,
      rack_pos_id = EXCLUDED.rack_pos_id,
      hall_id = EXCLUDED.hall_id,
      zone_id = EXCLUDED.zone_id,
      rotation_deg = EXCLUDED.rotation_deg,
      status = EXCLUDED.status,
      attributes = EXCLUDED.attributes,
      deleted_at = NULL
  RETURNING asset_id::text AS asset_id
`.execute(db.db);
```

Add `rackAssetId: rackAsset.rows[0].asset_id` to `assetFixture`.

Add tests after asset detail tests:

```ts
it('GET /api/v1/racks/:rackId returns rack detail shell', async () => {
  const token = await login();
  await request(app.getHttpServer())
    .get(`/api/v1/racks/${assetFixture.rackAssetId}`)
    .set('authorization', `Bearer ${token}`)
    .expect(200)
    .expect(({ body }) => {
      expect(body).toMatchObject({
        id: assetFixture.rackAssetId,
        assetTag: 'E2E-RACK-001',
        name: 'E2E Rack One',
        status: 'online',
        location: {
          rackPosition: { id: assetFixture.rackPositionId, name: 'E2E-RP1' },
        },
        capacity: {
          maxU: 42,
          maxPowerKw: 12.5,
        },
        units: [],
        containedAssets: [],
        activeAlarmSummary: null,
      });
    });
});

it('GET /api/v1/racks/:rackId returns 404 for missing rack', async () => {
  const token = await login();
  await request(app.getHttpServer())
    .get('/api/v1/racks/44444444-4444-4444-8444-444444444444')
    .set('authorization', `Bearer ${token}`)
    .expect(404)
    .expect(({ body }) => {
      expect(body.error.message).toBe('Rack not found');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run test:e2e -- --runInBand --testNamePattern='racks'
```

Expected: FAIL with 404 for `/api/v1/racks/:rackId`.

- [ ] **Step 3: Create rack types**

Create `backend-app/src/modules/racks/racks.types.ts`:

```ts
export interface RackDetail {
  id: string;
  assetTag: string;
  name: string;
  category: { code: string; name: string | null };
  model: {
    id: string;
    manufacturer: string | null;
    modelCode: string | null;
    displayName: string | null;
    rackUnits: number | null;
    spec: unknown;
  } | null;
  serialNo: string | null;
  status: string;
  location: {
    site: { id: string; name: string } | null;
    building: { id: string; name: string } | null;
    floor: { id: string; name: string } | null;
    hall: { id: string; name: string } | null;
    zone: { id: string; name: string } | null;
    row: { id: string; name: string } | null;
    rackPosition: { id: string; name: string } | null;
  };
  capacity: {
    maxU: number | null;
    usedU: number | null;
    maxPowerKw: number | null;
    usedPowerKw: number | null;
  };
  units: unknown[];
  containedAssets: unknown[];
  activeAlarmSummary: unknown | null;
}
```

- [ ] **Step 4: Create rack Swagger DTO**

Create `backend-app/src/modules/racks/dto/racks-response.dto.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';

class RackNodeDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
}

class RackCategoryDto {
  @ApiProperty() code!: string;
  @ApiProperty({ nullable: true }) name!: string | null;
}

class RackModelDto {
  @ApiProperty() id!: string;
  @ApiProperty({ nullable: true }) manufacturer!: string | null;
  @ApiProperty({ nullable: true }) modelCode!: string | null;
  @ApiProperty({ nullable: true }) displayName!: string | null;
  @ApiProperty({ nullable: true }) rackUnits!: number | null;
  @ApiProperty() spec!: unknown;
}

class RackLocationDto {
  @ApiProperty({ type: RackNodeDto, nullable: true }) site!: RackNodeDto | null;
  @ApiProperty({ type: RackNodeDto, nullable: true }) building!: RackNodeDto | null;
  @ApiProperty({ type: RackNodeDto, nullable: true }) floor!: RackNodeDto | null;
  @ApiProperty({ type: RackNodeDto, nullable: true }) hall!: RackNodeDto | null;
  @ApiProperty({ type: RackNodeDto, nullable: true }) zone!: RackNodeDto | null;
  @ApiProperty({ type: RackNodeDto, nullable: true }) row!: RackNodeDto | null;
  @ApiProperty({ type: RackNodeDto, nullable: true }) rackPosition!: RackNodeDto | null;
}

class RackCapacityDto {
  @ApiProperty({ nullable: true }) maxU!: number | null;
  @ApiProperty({ nullable: true }) usedU!: number | null;
  @ApiProperty({ nullable: true }) maxPowerKw!: number | null;
  @ApiProperty({ nullable: true }) usedPowerKw!: number | null;
}

export class RackDetailDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() assetTag!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ type: RackCategoryDto }) category!: RackCategoryDto;
  @ApiProperty({ type: RackModelDto, nullable: true }) model!: RackModelDto | null;
  @ApiProperty({ nullable: true }) serialNo!: string | null;
  @ApiProperty() status!: string;
  @ApiProperty({ type: RackLocationDto }) location!: RackLocationDto;
  @ApiProperty({ type: RackCapacityDto }) capacity!: RackCapacityDto;
  @ApiProperty({ type: [Object] }) units!: unknown[];
  @ApiProperty({ type: [Object] }) containedAssets!: unknown[];
  @ApiProperty({ nullable: true }) activeAlarmSummary!: unknown | null;
}
```

- [ ] **Step 5: Create repository**

Create `backend-app/src/modules/racks/racks.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DbService } from '../../db/db.service';

export interface RackDetailRow {
  id: string;
  asset_tag: string;
  name: string;
  category: string;
  category_name: string | null;
  model_id: string | null;
  manufacturer: string | null;
  model_code: string | null;
  model_display_name: string | null;
  rack_units: number | string | null;
  spec_json: unknown;
  serial_no: string | null;
  status: string;
  site_id: string | null;
  site_name: string | null;
  building_id: string | null;
  building_name: string | null;
  floor_id: string | null;
  floor_name: string | null;
  hall_id: string | null;
  hall_name: string | null;
  zone_id: string | null;
  zone_name: string | null;
  row_id: string | null;
  row_name: string | null;
  rack_position_id: string | null;
  rack_position_name: string | null;
  max_u: number | string | null;
  max_power_kw: number | string | null;
}

@Injectable()
export class RacksRepository {
  constructor(private readonly dbService: DbService) {}
  private get db() { return this.dbService.db; }

  async getRack(rackId: string): Promise<RackDetailRow | null> {
    const result = await sql<RackDetailRow>`
      SELECT
        a.asset_id::text AS id,
        a.asset_tag,
        a.display_name AS name,
        a.category_code AS category,
        ac.name AS category_name,
        am.model_id::text AS model_id,
        am.manufacturer,
        am.model_code,
        am.display_name AS model_display_name,
        am.rack_units,
        am.spec_json,
        a.serial_no,
        a.status::text AS status,
        s.site_id::text AS site_id,
        s.name AS site_name,
        b.building_id::text AS building_id,
        b.name AS building_name,
        f.floor_id::text AS floor_id,
        f.name AS floor_name,
        h.hall_id::text AS hall_id,
        h.name AS hall_name,
        z.zone_id::text AS zone_id,
        z.name AS zone_name,
        r.row_id::text AS row_id,
        r.code AS row_name,
        rp.rack_pos_id::text AS rack_position_id,
        rp.code AS rack_position_name,
        rp.max_u,
        rp.max_power_kw
      FROM asset.asset a
      LEFT JOIN asset.asset_category ac ON ac.code = a.category_code
      LEFT JOIN asset.asset_model am ON am.model_id = a.model_id
      LEFT JOIN facility.rack_position rp ON rp.rack_pos_id = a.rack_pos_id
      LEFT JOIN facility.row r ON r.row_id = rp.row_id
      LEFT JOIN facility.zone z ON z.zone_id = a.zone_id
      LEFT JOIN facility.hall h ON h.hall_id = COALESCE(r.hall_id, a.hall_id, z.hall_id)
      LEFT JOIN facility.floor f ON f.floor_id = h.floor_id
      LEFT JOIN facility.building b ON b.building_id = f.building_id
      LEFT JOIN facility.site s ON s.site_id = b.site_id
      WHERE a.deleted_at IS NULL
        AND a.asset_id = ${rackId}
      LIMIT 1
    `.execute(this.db);
    return result.rows[0] ?? null;
  }
}
```

- [ ] **Step 6: Create service**

Create `backend-app/src/modules/racks/racks.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { RackDetailRow, RacksRepository } from './racks.repository';
import { RackDetail } from './racks.types';

@Injectable()
export class RacksService {
  constructor(private readonly repository: RacksRepository) {}

  async getRack(rackId: string): Promise<RackDetail> {
    const row = await this.repository.getRack(rackId);
    if (!row) throw new NotFoundException('Rack not found');
    return toRackDetail(row);
  }
}

function toRackDetail(row: RackDetailRow): RackDetail {
  return {
    id: row.id,
    assetTag: row.asset_tag,
    name: row.name,
    category: { code: row.category, name: row.category_name },
    model: row.model_id ? {
      id: row.model_id,
      manufacturer: row.manufacturer,
      modelCode: row.model_code,
      displayName: row.model_display_name,
      rackUnits: toNumberOrNull(row.rack_units),
      spec: row.spec_json ?? {},
    } : null,
    serialNo: row.serial_no,
    status: row.status,
    location: {
      site: node(row.site_id, row.site_name),
      building: node(row.building_id, row.building_name),
      floor: node(row.floor_id, row.floor_name),
      hall: node(row.hall_id, row.hall_name),
      zone: node(row.zone_id, row.zone_name),
      row: node(row.row_id, row.row_name),
      rackPosition: node(row.rack_position_id, row.rack_position_name),
    },
    capacity: {
      maxU: toNumberOrNull(row.max_u),
      usedU: null,
      maxPowerKw: toNumberOrNull(row.max_power_kw),
      usedPowerKw: null,
    },
    units: [],
    containedAssets: [],
    activeAlarmSummary: null,
  };
}

function node(id: string | null, name: string | null) {
  return id ? { id, name: name ?? id } : null;
}

function toNumberOrNull(value: number | string | null): number | null {
  if (value === null) return null;
  return Number(value);
}
```

- [ ] **Step 7: Create controller and module**

Create `backend-app/src/modules/racks/racks.controller.ts`:

```ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { ApiErrorResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { RackDetailDto } from './dto/racks-response.dto';
import { RacksService } from './racks.service';

class RackIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  rackId!: string;
}

@ApiTags('racks')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('racks')
export class RacksController {
  constructor(private readonly racks: RacksService) {}

  @Get(':rackId')
  @ApiOperation({ summary: 'Get rack detail for viewer navigation.' })
  @ApiOkResponse({ type: RackDetailDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  getRack(@Param() params: RackIdParamDto) {
    return this.racks.getRack(params.rackId);
  }
}
```

Create `backend-app/src/modules/racks/racks.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { IamModule } from '../iam/iam.module';
import { RacksController } from './racks.controller';
import { RacksRepository } from './racks.repository';
import { RacksService } from './racks.service';

@Module({ imports: [DbModule, IamModule], controllers: [RacksController], providers: [RacksRepository, RacksService] })
export class RacksModule {}
```

- [ ] **Step 8: Register module**

Modify `backend-app/src/app.module.ts` imports:

```ts
import { RacksModule } from './modules/racks/racks.module';
```

Modify module list:

```ts
@Module({ imports: [LoggerModule, DbModule, HealthModule, IamModule, FacilityModule, AssetsModule, ScenesModule, RacksModule, TelemetryModule, AlarmsModule] })
export class AppModule {}
```

- [ ] **Step 9: Run rack tests**

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run test:e2e -- --runInBand --testNamePattern='racks'
```

Expected: PASS.

- [ ] **Step 10: Commit Task 2**

```bash
git -C /Users/ndiepdev/Developer/twin-database/backend add backend-app/src/app.module.ts backend-app/src/modules/racks backend-app/test/app.e2e-spec.ts
git -C /Users/ndiepdev/Developer/twin-database/backend commit -m "feat(racks): add rack detail endpoint"
```

---

## Task 3: Scene Assets API

**Files:**
- Modify: `backend-app/src/modules/scenes/scenes.controller.ts`
- Modify: `backend-app/src/modules/scenes/scenes.repository.ts`
- Modify: `backend-app/src/modules/scenes/scenes.service.ts`
- Modify: `backend-app/src/modules/scenes/scenes.types.ts`
- Modify: `backend-app/src/modules/scenes/dto/scenes-response.dto.ts`
- Test: `backend-app/test/app.e2e-spec.ts`

- [ ] **Step 1: Add failing e2e tests**

Add tests after scenes list test:

```ts
it('GET /api/v1/scenes/:sceneId/assets returns scene asset list shape', async () => {
  const token = await login();
  const scene = await sql<{ scene_id: string }>`
    INSERT INTO geom3d.scene (scene_id, site_id, name, environment, lod_strategy, is_default)
    VALUES ('55555555-5555-4555-8555-555555555555', ${assetFixture.siteId}, 'E2E Scene', '{}'::jsonb, 'auto', true)
    ON CONFLICT (scene_id) DO UPDATE SET site_id = EXCLUDED.site_id, name = EXCLUDED.name
    RETURNING scene_id::text AS scene_id
  `.execute(db.db);

  await request(app.getHttpServer())
    .get(`/api/v1/scenes/${scene.rows[0].scene_id}/assets?limit=10`)
    .set('authorization', `Bearer ${token}`)
    .expect(200)
    .expect(({ body }) => {
      expect(Array.isArray(body.items)).toBe(true);
      expect(body.nextCursor).toBeNull();
      expect(body.items.some((item: { id: string }) => item.id === assetFixture.assetId)).toBe(true);
    });
});

it('GET /api/v1/scenes/:sceneId/assets returns 404 for missing scene', async () => {
  const token = await login();
  await request(app.getHttpServer())
    .get('/api/v1/scenes/66666666-6666-4666-8666-666666666666/assets')
    .set('authorization', `Bearer ${token}`)
    .expect(404)
    .expect(({ body }) => {
      expect(body.error.message).toBe('Scene not found');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run test:e2e -- --runInBand --testNamePattern='scene.*assets'
```

Expected: FAIL with 404 for scene assets route.

- [ ] **Step 3: Add scene asset types**

Append to `backend-app/src/modules/scenes/scenes.types.ts`:

```ts
export interface SceneAssetSummary {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  status: string;
  location: {
    siteId: string | null;
    buildingId: string | null;
    floorId: string | null;
    hallId: string | null;
    zoneId: string | null;
    rowId: string | null;
    rackPositionId: string | null;
  };
  geometry: {
    rotationDeg: number | null;
    coordinates: unknown | null;
  };
}

export interface SceneAssetsResponse {
  items: SceneAssetSummary[];
  nextCursor: string | null;
}
```

- [ ] **Step 4: Add response DTOs**

Append to `backend-app/src/modules/scenes/dto/scenes-response.dto.ts`:

```ts
export class SceneAssetLocationDto {
  @ApiProperty({ nullable: true }) siteId!: string | null;
  @ApiProperty({ nullable: true }) buildingId!: string | null;
  @ApiProperty({ nullable: true }) floorId!: string | null;
  @ApiProperty({ nullable: true }) hallId!: string | null;
  @ApiProperty({ nullable: true }) zoneId!: string | null;
  @ApiProperty({ nullable: true }) rowId!: string | null;
  @ApiProperty({ nullable: true }) rackPositionId!: string | null;
}

export class SceneAssetGeometryDto {
  @ApiProperty({ nullable: true }) rotationDeg!: number | null;
  @ApiProperty({ nullable: true }) coordinates!: unknown | null;
}

export class SceneAssetSummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() assetTag!: string;
  @ApiProperty() name!: string;
  @ApiProperty() category!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ type: SceneAssetLocationDto }) location!: SceneAssetLocationDto;
  @ApiProperty({ type: SceneAssetGeometryDto }) geometry!: SceneAssetGeometryDto;
}

export class SceneAssetsResponseDto {
  @ApiProperty({ type: [SceneAssetSummaryDto] }) items!: SceneAssetSummaryDto[];
  @ApiProperty({ nullable: true }) nextCursor!: string | null;
}
```

- [ ] **Step 5: Add repository methods**

Add interfaces to `backend-app/src/modules/scenes/scenes.repository.ts`:

```ts
export interface SceneAssetRow {
  id: string;
  asset_tag: string;
  name: string;
  category: string;
  status: string;
  site_id: string | null;
  building_id: string | null;
  floor_id: string | null;
  hall_id: string | null;
  zone_id: string | null;
  row_id: string | null;
  rack_position_id: string | null;
  rotation_deg: number | string | null;
  coordinates: unknown | null;
}
```

Add methods in `ScenesRepository`:

```ts
async sceneExists(sceneId: string): Promise<boolean> {
  const result = await sql<{ exists: boolean }>`
    SELECT EXISTS(SELECT 1 FROM geom3d.scene WHERE scene_id = ${sceneId}) AS exists
  `.execute(this.db);
  return result.rows[0]?.exists ?? false;
}

async listSceneAssets(sceneId: string, query: { limit?: number; cursor?: string; bbox?: string; lod?: number }): Promise<SceneAssetRow[]> {
  const limit = query.limit ?? 500;
  const bbox = parseBbox(query.bbox);
  const result = await sql<SceneAssetRow>`
    WITH selected_scene AS (
      SELECT site_id FROM geom3d.scene WHERE scene_id = ${sceneId} LIMIT 1
    )
    SELECT
      a.asset_id::text AS id,
      a.asset_tag,
      a.display_name AS name,
      a.category_code AS category,
      a.status::text AS status,
      s.site_id::text AS site_id,
      b.building_id::text AS building_id,
      f.floor_id::text AS floor_id,
      h.hall_id::text AS hall_id,
      z.zone_id::text AS zone_id,
      r.row_id::text AS row_id,
      rp.rack_pos_id::text AS rack_position_id,
      a.rotation_deg,
      ST_AsGeoJSON(a.geom)::json AS coordinates
    FROM asset.asset a
    LEFT JOIN facility.rack_position rp ON rp.rack_pos_id = a.rack_pos_id
    LEFT JOIN facility.row r ON r.row_id = rp.row_id
    LEFT JOIN facility.zone z ON z.zone_id = a.zone_id
    LEFT JOIN facility.hall h ON h.hall_id = COALESCE(r.hall_id, a.hall_id, z.hall_id)
    LEFT JOIN facility.floor f ON f.floor_id = h.floor_id
    LEFT JOIN facility.building b ON b.building_id = f.building_id
    LEFT JOIN facility.site s ON s.site_id = b.site_id
    CROSS JOIN selected_scene ss
    WHERE a.deleted_at IS NULL
      AND s.site_id = ss.site_id
      AND (${query.cursor ?? null}::text IS NULL OR a.asset_id::text > ${query.cursor ?? null})
      AND (${bbox ? bbox.minX : null}::double precision IS NULL OR a.geom IS NULL OR ST_Intersects(a.geom, ST_MakeEnvelope(${bbox ? bbox.minX : null}, ${bbox ? bbox.minY : null}, ${bbox ? bbox.maxX : null}, ${bbox ? bbox.maxY : null}, 4326)))
    ORDER BY a.asset_id::text ASC
    LIMIT ${limit + 1}
  `.execute(this.db);
  return result.rows;
}
```

Add helper below class:

```ts
function parseBbox(bbox?: string): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (!bbox) return null;
  const values = bbox.split(',').map(Number);
  if (values.length !== 6 || values.some((value) => Number.isNaN(value))) return null;
  return { minX: values[0], minY: values[1], maxX: values[3], maxY: values[4] };
}
```

- [ ] **Step 6: Add service method**

Modify imports in `backend-app/src/modules/scenes/scenes.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { SceneAssetRow, ScenesRepository } from './scenes.repository';
import { SceneAssetSummary, SceneAssetsResponse, SceneManifest, ScenesResponse } from './scenes.types';
```

Add method:

```ts
async listSceneAssets(sceneId: string, query: { limit?: number; cursor?: string; bbox?: string; lod?: number }): Promise<SceneAssetsResponse> {
  if (!(await this.repository.sceneExists(sceneId))) throw new NotFoundException('Scene not found');
  const limit = query.limit ?? 500;
  const rows = await this.repository.listSceneAssets(sceneId, query);
  const pageRows = rows.slice(0, limit);
  const items = pageRows.map(toSceneAssetSummary);
  return {
    items,
    nextCursor: rows.length > limit ? items[items.length - 1]?.id ?? null : null,
  };
}
```

Add mapper:

```ts
function toSceneAssetSummary(row: SceneAssetRow): SceneAssetSummary {
  return {
    id: row.id,
    assetTag: row.asset_tag,
    name: row.name,
    category: row.category,
    status: row.status,
    location: {
      siteId: row.site_id,
      buildingId: row.building_id,
      floorId: row.floor_id,
      hallId: row.hall_id,
      zoneId: row.zone_id,
      rowId: row.row_id,
      rackPositionId: row.rack_position_id,
    },
    geometry: {
      rotationDeg: toNumberOrNull(row.rotation_deg),
      coordinates: row.coordinates,
    },
  };
}

function toNumberOrNull(value: number | string | null): number | null {
  if (value === null) return null;
  return Number(value);
}
```

- [ ] **Step 7: Add controller route**

Modify `backend-app/src/modules/scenes/scenes.controller.ts` imports:

```ts
import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiProperty, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { SceneAssetsResponseDto, SceneManifestDto, ScenesResponseDto } from './dto/scenes-response.dto';
```

Add route below manifest route:

```ts
@Get(':sceneId/assets')
@ApiBearerAuth('bearer')
@ApiOperation({ summary: 'List assets visible in a scene.' })
@ApiQuery({ name: 'bbox', required: false, schema: { type: 'string' }, description: 'minX,minY,minZ,maxX,maxY,maxZ' })
@ApiQuery({ name: 'lod', required: false, schema: { type: 'integer' } })
@ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', minimum: 1, maximum: 1000, default: 500 } })
@ApiQuery({ name: 'cursor', required: false, schema: { type: 'string' } })
@ApiOkResponse({ type: SceneAssetsResponseDto })
@ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
@ApiForbiddenResponse({ type: ApiErrorResponseDto })
@ApiNotFoundResponse({ type: ApiErrorResponseDto })
listSceneAssets(
  @Param() params: SceneIdParamDto,
  @Query('bbox') bbox?: string,
  @Query('lod') lod?: string,
  @Query('limit', new DefaultValuePipe(500), ParseIntPipe) limit?: number,
  @Query('cursor') cursor?: string,
) {
  return this.scenes.listSceneAssets(params.sceneId, { bbox, lod: lod ? Number(lod) : undefined, limit, cursor });
}
```

- [ ] **Step 8: Run scene assets tests**

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run test:e2e -- --runInBand --testNamePattern='scene.*assets'
```

Expected: PASS.

- [ ] **Step 9: Commit Task 3**

```bash
git -C /Users/ndiepdev/Developer/twin-database/backend add backend-app/src/modules/scenes backend-app/test/app.e2e-spec.ts
git -C /Users/ndiepdev/Developer/twin-database/backend commit -m "feat(scenes): add scene asset listing"
```

---

## Task 4: Viewpoints API

**Files:**
- Create: `backend-app/src/modules/viewer/viewer.module.ts`
- Create: `backend-app/src/modules/viewer/viewer.controller.ts`
- Create: `backend-app/src/modules/viewer/viewer.repository.ts`
- Create: `backend-app/src/modules/viewer/viewer.service.ts`
- Create: `backend-app/src/modules/viewer/viewer.types.ts`
- Create: `backend-app/src/modules/viewer/dto/viewpoints-query.dto.ts`
- Create: `backend-app/src/modules/viewer/dto/viewpoints-response.dto.ts`
- Modify: `backend-app/src/app.module.ts`
- Test: `backend-app/test/app.e2e-spec.ts`

- [ ] **Step 1: Add failing e2e test**

Add after scene asset tests:

```ts
it('GET /api/v1/viewpoints returns list shape', async () => {
  const token = await login();
  await request(app.getHttpServer())
    .get('/api/v1/viewpoints')
    .set('authorization', `Bearer ${token}`)
    .expect(200)
    .expect(({ body }) => {
      expect(Array.isArray(body.items)).toBe(true);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run test:e2e -- --runInBand --testNamePattern='viewpoints'
```

Expected: FAIL with 404.

- [ ] **Step 3: Create types and DTOs**

Create `backend-app/src/modules/viewer/viewer.types.ts`:

```ts
export interface ViewpointSummary {
  id: string;
  sceneId: string | null;
  name: string;
  type: string;
  target: unknown;
  camera: unknown;
  sortOrder: number | null;
}

export interface ViewpointsResponse {
  items: ViewpointSummary[];
}
```

Create `backend-app/src/modules/viewer/dto/viewpoints-query.dto.ts`:

```ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ViewpointsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sceneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;
}
```

Create `backend-app/src/modules/viewer/dto/viewpoints-response.dto.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';

export class ViewpointSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty({ nullable: true }) sceneId!: string | null;
  @ApiProperty() name!: string;
  @ApiProperty() type!: string;
  @ApiProperty() target!: unknown;
  @ApiProperty() camera!: unknown;
  @ApiProperty({ nullable: true }) sortOrder!: number | null;
}

export class ViewpointsResponseDto {
  @ApiProperty({ type: [ViewpointSummaryDto] }) items!: ViewpointSummaryDto[];
}
```

- [ ] **Step 4: Create repository with missing-table fallback**

Create `backend-app/src/modules/viewer/viewer.repository.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DbService } from '../../db/db.service';
import { ViewpointsQueryDto } from './dto/viewpoints-query.dto';

export interface ViewpointRow {
  id: string;
  scene_id: string | null;
  name: string;
  type: string;
  target: unknown;
  camera: unknown;
  sort_order: number | string | null;
}

@Injectable()
export class ViewerRepository {
  constructor(private readonly dbService: DbService) {}
  private get db() { return this.dbService.db; }

  async listViewpoints(query: ViewpointsQueryDto): Promise<ViewpointRow[]> {
    if (!(await this.tableExists('viewer', 'viewpoint'))) return [];
    const result = await sql<ViewpointRow>`
      SELECT
        viewpoint_id::text AS id,
        scene_id::text AS scene_id,
        name,
        type::text AS type,
        target,
        camera,
        sort_order
      FROM viewer.viewpoint
      WHERE (${query.sceneId ?? null}::text IS NULL OR scene_id::text = ${query.sceneId ?? null})
        AND (${query.type ?? null}::text IS NULL OR type::text = ${query.type ?? null})
      ORDER BY sort_order NULLS LAST, name ASC
    `.execute(this.db);
    return result.rows;
  }

  private async tableExists(schemaName: string, tableName: string): Promise<boolean> {
    const result = await sql<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = ${schemaName}
          AND table_name = ${tableName}
      ) AS exists
    `.execute(this.db);
    return result.rows[0]?.exists ?? false;
  }
}
```

- [ ] **Step 5: Create service**

Create `backend-app/src/modules/viewer/viewer.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { ViewpointsQueryDto } from './dto/viewpoints-query.dto';
import { ViewerRepository, ViewpointRow } from './viewer.repository';
import { ViewpointSummary, ViewpointsResponse } from './viewer.types';

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
    target: row.target ?? {},
    camera: row.camera ?? {},
    sortOrder: toNumberOrNull(row.sort_order),
  };
}

function toNumberOrNull(value: number | string | null): number | null {
  if (value === null) return null;
  return Number(value);
}
```

- [ ] **Step 6: Create controller and module**

Create `backend-app/src/modules/viewer/viewer.controller.ts`:

```ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { ViewpointsQueryDto } from './dto/viewpoints-query.dto';
import { ViewpointsResponseDto } from './dto/viewpoints-response.dto';
import { ViewerService } from './viewer.service';

@ApiTags('viewer')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('viewpoints')
export class ViewerController {
  constructor(private readonly viewer: ViewerService) {}

  @Get()
  @ApiOperation({ summary: 'List predefined viewer navigation targets.' })
  @ApiQuery({ name: 'sceneId', required: false, schema: { type: 'string' } })
  @ApiQuery({ name: 'type', required: false, schema: { type: 'string' } })
  @ApiOkResponse({ type: ViewpointsResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  listViewpoints(@Query() query: ViewpointsQueryDto) {
    return this.viewer.listViewpoints(query);
  }
}
```

Create `backend-app/src/modules/viewer/viewer.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { IamModule } from '../iam/iam.module';
import { ViewerController } from './viewer.controller';
import { ViewerRepository } from './viewer.repository';
import { ViewerService } from './viewer.service';

@Module({ imports: [DbModule, IamModule], controllers: [ViewerController], providers: [ViewerRepository, ViewerService] })
export class ViewerModule {}
```

- [ ] **Step 7: Register module**

Modify `backend-app/src/app.module.ts` imports:

```ts
import { ViewerModule } from './modules/viewer/viewer.module';
```

Modify module list:

```ts
@Module({ imports: [LoggerModule, DbModule, HealthModule, IamModule, FacilityModule, AssetsModule, ScenesModule, RacksModule, ViewerModule, TelemetryModule, AlarmsModule] })
export class AppModule {}
```

- [ ] **Step 8: Run viewpoint tests**

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run test:e2e -- --runInBand --testNamePattern='viewpoints'
```

Expected: PASS.

- [ ] **Step 9: Commit Task 4**

```bash
git -C /Users/ndiepdev/Developer/twin-database/backend add backend-app/src/app.module.ts backend-app/src/modules/viewer backend-app/test/app.e2e-spec.ts
git -C /Users/ndiepdev/Developer/twin-database/backend commit -m "feat(viewer): add viewpoints endpoint"
```

---

## Task 5: Swagger, Full Verification, and Docker Smoke

**Files:**
- Modify: `backend-app/test/app.e2e-spec.ts`

- [ ] **Step 1: Add Swagger regression test**

Append near existing Swagger test:

```ts
it('documents sprint 2 viewer navigation parameters', () => {
  const document = SwaggerModule.createDocument(app, new DocumentBuilder().build());

  expect(document.paths['/api/v1/facility/rack-positions']?.get?.parameters).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'siteId', in: 'query' }),
      expect.objectContaining({ name: 'limit', in: 'query' }),
    ]),
  );
  expect(document.paths['/api/v1/racks/{rackId}']?.get?.parameters).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'rackId', in: 'path', required: true }),
    ]),
  );
  expect(document.paths['/api/v1/scenes/{sceneId}/assets']?.get?.parameters).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'sceneId', in: 'path', required: true }),
      expect.objectContaining({ name: 'bbox', in: 'query' }),
    ]),
  );
  expect(document.paths['/api/v1/viewpoints']?.get?.parameters).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'sceneId', in: 'query' }),
      expect.objectContaining({ name: 'type', in: 'query' }),
    ]),
  );
});
```

- [ ] **Step 2: Run Swagger test**

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run test:e2e -- --runInBand --testNamePattern='documents sprint 2'
```

Expected: PASS.

- [ ] **Step 3: Run full e2e suite**

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run test:e2e -- --runInBand
```

Expected: all tests PASS.

- [ ] **Step 4: Run build**

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run build
```

Expected: exit 0.

- [ ] **Step 5: Build Docker image**

```bash
docker build -t twin-backend-app:latest /Users/ndiepdev/Developer/twin-database/backend/backend-app
```

Expected: `npm run build` inside Docker succeeds and image exports.

- [ ] **Step 6: Run Docker container**

```bash
docker rm -f twin-backend-app 2>/dev/null || true
docker run -d --name twin-backend-app --network bridge -p 3000:3000 \
  -e NODE_ENV=development \
  -e APP_ENV=local \
  -e APP_HOST=0.0.0.0 \
  -e APP_PORT=3000 \
  -e DATABASE_URL='postgresql://twin:Twin%40db@host.docker.internal:5432/twin_db' \
  -e LOG_LEVEL=info \
  -e JWT_SECRET='docker-local-secret-at-least-16' \
  -e API_KEY_PEPPER='docker-local-pepper' \
  twin-backend-app:latest
```

Expected: container id printed.

- [ ] **Step 7: Smoke health endpoint**

```bash
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3000/api/v1/health; then exit 0; fi
  sleep 1
done
docker logs twin-backend-app
exit 1
```

Expected: `{"status":"ok","service":"twin-backend","version":"0.1.0"}`.

- [ ] **Step 8: Commit final verification test**

```bash
git -C /Users/ndiepdev/Developer/twin-database/backend add backend-app/test/app.e2e-spec.ts
git -C /Users/ndiepdev/Developer/twin-database/backend commit -m "test: cover sprint 2 swagger docs"
```

---

## Final Handoff

- [ ] **Step 1: Check branch and diff**

```bash
git -C /Users/ndiepdev/Developer/twin-database/backend status --short --branch
git -C /Users/ndiepdev/Developer/twin-database/backend log --oneline --decorate -8
```

Expected: branch `sprint-2`; working tree clean after commits.

- [ ] **Step 2: Report exact verification evidence**

Include these outputs in handoff:

- `npm run test:e2e -- --runInBand` pass count
- `npm run build` exit 0
- Docker health response
- Latest commits on `sprint-2`

- [ ] **Step 3: Ask before push if not already requested**

If user asks to push:

```bash
git -C /Users/ndiepdev/Developer/twin-database/backend push -u origin sprint-2
```

Expected: branch pushed to origin.

---

## Self-Review Notes

Spec coverage:

- `GET /api/v1/facility/rack-positions` covered by Task 1.
- `GET /api/v1/racks/{rackId}` covered by Task 2.
- `GET /api/v1/scenes/{sceneId}/assets` covered by Task 3.
- `GET /api/v1/viewpoints` covered by Task 4.
- Auth/RBAC covered in each controller via `AuthGuard`, `RbacGuard`, `asset:read`.
- Swagger path/query params covered in Task 5.
- Missing optional data maps to `[]`/`null` in rack and viewpoint tasks; scene assets uses current facility/site fallback.

No placeholder terms remain. Type names match the files and method signatures used in later tasks.
