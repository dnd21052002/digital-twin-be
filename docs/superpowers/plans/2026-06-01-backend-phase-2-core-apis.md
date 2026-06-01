# Backend Phase 2 Core APIs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build authenticated read-only facility, asset, and scene APIs needed by Sprint 1 frontend real-data adapter work.

**Architecture:** Add focused NestJS modules for `facility`, `assets`, and `scenes`. Controllers validate inputs and require `AuthGuard`; services delegate to repositories; repositories use Kysely `sql` raw queries through existing `DbService`, matching `IamRepository` style. IDs from bigint facility tables are serialized as strings; UUID asset/scene IDs remain strings.

**Tech Stack:** NestJS 10, TypeScript, Kysely, PostgreSQL/Timescale/PostGIS, Jest/Supertest, Docker.

---

## File Structure

Create:

- `backend-app/src/common/dto/pagination.dto.ts` — reusable `limit` and `cursor` query DTO.
- `backend-app/src/common/dto/uuid-param.dto.ts` — reusable UUID route param DTO.
- `backend-app/src/modules/facility/facility.types.ts` — response types for facility tree.
- `backend-app/src/modules/facility/facility.repository.ts` — SQL reads from `facility.*` tables.
- `backend-app/src/modules/facility/facility.service.ts` — tree assembly boundary.
- `backend-app/src/modules/facility/facility.controller.ts` — `GET /facility/tree`.
- `backend-app/src/modules/facility/facility.module.ts` — Nest module.
- `backend-app/src/modules/assets/dto/assets-query.dto.ts` — query validation for asset list.
- `backend-app/src/modules/assets/assets.types.ts` — response types for asset list/detail.
- `backend-app/src/modules/assets/assets.repository.ts` — SQL reads from `asset.*` and facility joins.
- `backend-app/src/modules/assets/assets.service.ts` — list/detail logic and 404.
- `backend-app/src/modules/assets/assets.controller.ts` — `GET /assets`, `GET /assets/:assetId`.
- `backend-app/src/modules/assets/assets.module.ts` — Nest module.
- `backend-app/src/modules/scenes/scenes.types.ts` — response types for scene list/manifest.
- `backend-app/src/modules/scenes/scenes.repository.ts` — SQL reads from `geom3d.*`.
- `backend-app/src/modules/scenes/scenes.service.ts` — list/manifest logic and 404.
- `backend-app/src/modules/scenes/scenes.controller.ts` — `GET /scenes`, `GET /scenes/:sceneId/manifest`.
- `backend-app/src/modules/scenes/scenes.module.ts` — Nest module.

Modify:

- `backend-app/src/app.module.ts` — import new modules.
- `backend-app/test/app.e2e-spec.ts` — add Phase 2 e2e coverage.
- `TASKS.md` — mark Sprint 1 Phase 2 endpoints done.
- `API.md` — document concrete Phase 2 response fields.
- `backend-app/package.json` — fix `start:prod` to `node dist/src/main.js` if still wrong.

---

### Task 1: Shared DTOs

**Files:**
- Create: `backend-app/src/common/dto/pagination.dto.ts`
- Create: `backend-app/src/common/dto/uuid-param.dto.ts`

- [ ] **Step 1: Create pagination DTO**

```ts
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;

  @IsOptional()
  @IsString()
  cursor?: string;
}
```

- [ ] **Step 2: Create UUID param DTO**

```ts
import { IsUUID } from 'class-validator';

export class UuidParamDto {
  @IsUUID()
  id!: string;
}
```

- [ ] **Step 3: Run lint/typecheck gate**

Run:

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run lint
npm run build
```

Expected: lint/build pass or only unrelated pre-existing issues reported.

---

### Task 2: Facility tree endpoint

**Files:**
- Create: `backend-app/src/modules/facility/facility.types.ts`
- Create: `backend-app/src/modules/facility/facility.repository.ts`
- Create: `backend-app/src/modules/facility/facility.service.ts`
- Create: `backend-app/src/modules/facility/facility.controller.ts`
- Create: `backend-app/src/modules/facility/facility.module.ts`
- Modify: `backend-app/src/app.module.ts`

- [ ] **Step 1: Add response types**

```ts
export interface RackPositionNode { id: string; code: string; positionIndex: number; maxU: number | null; maxPowerKw: number | null; currentRackId: string | null; }
export interface RowNode { id: string; code: string; orientationDeg: number | null; rackPositions: RackPositionNode[]; }
export interface ZoneNode { id: string; code: string; name: string; zoneType: string; rows: RowNode[]; }
export interface HallNode { id: string; code: string; name: string; areaM2: number | null; zones: ZoneNode[]; rows: RowNode[]; }
export interface FloorNode { id: string; code: string; name: string; level: number; halls: HallNode[]; }
export interface BuildingNode { id: string; code: string; name: string; floorCount: number | null; floors: FloorNode[]; }
export interface SiteNode { id: string; code: string; name: string; timezone: string | null; buildings: BuildingNode[]; }
export interface FacilityTreeResponse { sites: SiteNode[]; }
```

- [ ] **Step 2: Add repository SQL row and tree assembly**

Implement `FacilityRepository.getTree()` returning `FacilityTreeResponse`. Query one flattened result across `facility.site`, `building`, `floor`, `hall`, `zone`, `row`, `rack_position`, excluding deleted sites/buildings. Convert all bigint IDs via `String(value)`. Use maps to dedupe nodes. Add rows under both `hall.rows` and matching `zone.rows` when `zone_id` exists; rack positions under row.

- [ ] **Step 3: Add service/controller/module**

`FacilityController`:

```ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../iam/auth.guard';
import { FacilityService } from './facility.service';

@UseGuards(AuthGuard)
@Controller('facility')
export class FacilityController {
  constructor(private readonly facility: FacilityService) {}

  @Get('tree')
  getTree() {
    return this.facility.getTree();
  }
}
```

- [ ] **Step 4: Import module in app module**

```ts
@Module({ imports: [LoggerModule, DbModule, HealthModule, IamModule, FacilityModule] })
export class AppModule {}
```

- [ ] **Step 5: Add e2e assertion**

In `test/app.e2e-spec.ts`, after auth login obtains token, add request:

```ts
await request(app.getHttpServer())
  .get('/api/v1/facility/tree')
  .set('authorization', `Bearer ${token}`)
  .expect(200)
  .expect(({ body }) => {
    expect(Array.isArray(body.sites)).toBe(true);
  });
```

- [ ] **Step 6: Run e2e target**

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run test:e2e
```

Expected: facility tree test passes against Docker DB.

---

### Task 3: Assets list/detail endpoints

**Files:**
- Create: `backend-app/src/modules/assets/dto/assets-query.dto.ts`
- Create: `backend-app/src/modules/assets/assets.types.ts`
- Create: `backend-app/src/modules/assets/assets.repository.ts`
- Create: `backend-app/src/modules/assets/assets.service.ts`
- Create: `backend-app/src/modules/assets/assets.controller.ts`
- Create: `backend-app/src/modules/assets/assets.module.ts`
- Modify: `backend-app/src/app.module.ts`
- Modify: `backend-app/test/app.e2e-spec.ts`

- [ ] **Step 1: Add query DTO**

```ts
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class AssetsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class AssetIdParamDto {
  @IsUUID()
  assetId!: string;
}
```

- [ ] **Step 2: Add response types**

Define `AssetSummary`, `AssetDetail`, `AssetsResponse` with camelCase fields from design spec.

- [ ] **Step 3: Add repository**

Implement:

```ts
async listAssets(query: AssetsQuery): Promise<AssetsResponse>
async getAsset(assetId: string): Promise<AssetDetail | null>
```

Use SQL joins:

- `asset.asset a`
- `asset.asset_category c ON c.code = a.category_code`
- `asset.asset_model m ON m.model_id = a.model_id`
- `facility.rack_position rp ON rp.rack_pos_id = a.rack_pos_id`
- `facility.row r ON r.row_id = rp.row_id`
- `facility.hall h ON h.hall_id = COALESCE(a.hall_id, r.hall_id)`
- `facility.floor f ON f.floor_id = h.floor_id`
- `facility.building b ON b.building_id = f.building_id`
- `facility.site s ON s.site_id = b.site_id`
- `facility.zone z ON z.zone_id = a.zone_id`

Filtering:

- `a.deleted_at IS NULL`
- `q` uses `ILIKE '%' || q || '%'` against `asset_tag`, `display_name`.
- `category` exact `a.category_code`.
- `status` exact `a.status::text`.
- `siteId` compares `s.site_id::text`.
- `cursor` compares `a.asset_id::text > cursor`.
- Fetch `limit + 1`; set `nextCursor` from extra row.

- [ ] **Step 4: Add service/controller/module**

`AssetsService.getAsset()` throws `NotFoundException('Asset not found')` on null. Controller uses `@Param() params: AssetIdParamDto` and `@Query() query: AssetsQueryDto`.

- [ ] **Step 5: Import module in app module**

```ts
@Module({ imports: [LoggerModule, DbModule, HealthModule, IamModule, FacilityModule, AssetsModule] })
export class AppModule {}
```

- [ ] **Step 6: Add e2e assertions**

After login token:

```ts
const assets = await request(app.getHttpServer())
  .get('/api/v1/assets?limit=5')
  .set('authorization', `Bearer ${token}`)
  .expect(200);
expect(Array.isArray(assets.body.items)).toBe(true);
expect(assets.body.items.length).toBeLessThanOrEqual(5);
expect(Object.prototype.hasOwnProperty.call(assets.body, 'nextCursor')).toBe(true);

if (assets.body.items.length > 0) {
  await request(app.getHttpServer())
    .get(`/api/v1/assets/${assets.body.items[0].id}`)
    .set('authorization', `Bearer ${token}`)
    .expect(200)
    .expect(({ body }) => {
      expect(body.id).toBe(assets.body.items[0].id);
      expect(body.assetTag).toBeTruthy();
    });
}

await request(app.getHttpServer())
  .get('/api/v1/assets/not-a-uuid')
  .set('authorization', `Bearer ${token}`)
  .expect(400);

await request(app.getHttpServer())
  .get('/api/v1/assets/00000000-0000-4000-8000-000000000000')
  .set('authorization', `Bearer ${token}`)
  .expect(404);
```

- [ ] **Step 7: Run e2e**

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run test:e2e
```

Expected: asset list/detail tests pass.

---

### Task 4: Scenes list/manifest endpoints

**Files:**
- Create: `backend-app/src/modules/scenes/scenes.types.ts`
- Create: `backend-app/src/modules/scenes/scenes.repository.ts`
- Create: `backend-app/src/modules/scenes/scenes.service.ts`
- Create: `backend-app/src/modules/scenes/scenes.controller.ts`
- Create: `backend-app/src/modules/scenes/scenes.module.ts`
- Modify: `backend-app/src/app.module.ts`
- Modify: `backend-app/test/app.e2e-spec.ts`

- [ ] **Step 1: Add response types**

Define:

```ts
export interface SceneSummary { id: string; siteId: string; name: string; isDefault: boolean; lodStrategy: string; createdAt: string; updatedAt: string; }
export interface ScenesResponse { items: SceneSummary[]; }
export interface MeshAssetManifest { id: string; name: string; format: string; lodLevel: number; storageUrl: string; boundingBox: unknown; attributes: unknown; }
export interface TextureAssetManifest { id: string; name: string; storageUrl: string; widthPx: number | null; heightPx: number | null; channels: number | null; encoding: string | null; }
export interface SceneManifest { scene: SceneSummary & { environment: unknown; defaultCameraId: string | null }; meshes: MeshAssetManifest[]; textures: TextureAssetManifest[]; }
```

- [ ] **Step 2: Add repository**

Implement:

```ts
async listScenes(): Promise<ScenesResponse>
async getSceneManifest(sceneId: string): Promise<SceneManifest | null>
```

`listScenes()` selects from `geom3d.scene ORDER BY is_default DESC, name ASC`.

`getSceneManifest()` first selects scene by `scene_id`. If none, return null. Then selects all non-deleted meshes and all textures. Current schema lacks direct scene↔mesh join; include all active mesh/texture assets for now and document this in code with no noisy comment beyond one sentence.

- [ ] **Step 3: Add service/controller/module**

Controller routes:

```ts
@UseGuards(AuthGuard)
@Controller('scenes')
export class ScenesController {
  @Get()
  listScenes() { return this.scenes.listScenes(); }

  @Get(':sceneId/manifest')
  getManifest(@Param() params: SceneIdParamDto) { return this.scenes.getManifest(params.sceneId); }
}
```

`SceneIdParamDto` validates UUID.

- [ ] **Step 4: Import module in app module**

```ts
@Module({ imports: [LoggerModule, DbModule, HealthModule, IamModule, FacilityModule, AssetsModule, ScenesModule] })
export class AppModule {}
```

- [ ] **Step 5: Add e2e assertions**

```ts
await request(app.getHttpServer())
  .get('/api/v1/scenes')
  .set('authorization', `Bearer ${token}`)
  .expect(200)
  .expect(({ body }) => {
    expect(Array.isArray(body.items)).toBe(true);
  });

await request(app.getHttpServer())
  .get('/api/v1/scenes/00000000-0000-4000-8000-000000000000/manifest')
  .set('authorization', `Bearer ${token}`)
  .expect(404);
```

- [ ] **Step 6: Run e2e**

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run test:e2e
```

Expected: scenes tests pass even when DB has zero scene rows.

---

### Task 5: Docs, scripts, Docker verification

**Files:**
- Modify: `backend-app/package.json`
- Modify: `TASKS.md`
- Modify: `API.md`

- [ ] **Step 1: Fix production start script**

Change:

```json
"start:prod": "node dist/main.js"
```

to:

```json
"start:prod": "node dist/src/main.js"
```

- [ ] **Step 2: Update TASKS.md**

Mark these complete:

```md
- [x] Implement `GET /api/v1/facility/tree`.
- [x] Implement `GET /api/v1/assets` with search/filter/pagination.
- [x] Implement `GET /api/v1/assets/{assetId}`.
- [x] Implement `GET /api/v1/scenes`.
- [x] Implement `GET /api/v1/scenes/{sceneId}/manifest`.
```

Leave other Phase 2 tasks unchecked.

- [ ] **Step 3: Update API.md**

Expand Phase 2 endpoint docs with concrete response shapes matching implementation.

- [ ] **Step 4: Run quality gates**

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
npm run lint
npm run test
npm run test:e2e
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 5: Build/restart backend Docker**

```bash
cd /Users/ndiepdev/Developer/twin-database/backend/backend-app
docker build -t twin-backend-app:phase-2 .
docker rm -f twin-backend-app 2>/dev/null || true
docker run -d \
  --name twin-backend-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e APP_ENV=production \
  -e APP_HOST=0.0.0.0 \
  -e APP_PORT=3000 \
  -e DATABASE_URL='postgresql://twin:Twin%40db@host.docker.internal:5432/twin_db' \
  -e JWT_SECRET='local-production-secret-change-me-32chars' \
  -e API_KEY_PEPPER='local-production-api-pepper-32chars' \
  -e LOG_LEVEL=info \
  -e CORS_ORIGINS='http://localhost:3000,http://localhost:5173,http://localhost:8080' \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD='Admin@123456' \
  -e ADMIN_DISPLAY_NAME=Admin \
  twin-backend-app:phase-2
```

- [ ] **Step 6: Verify Docker runtime**

```bash
curl -s http://localhost:3000/api/v1/health
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login -H 'content-type: application/json' -d '{"identifier":"admin","password":"Admin@123456"}' | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).accessToken))")
curl -s -H "authorization: Bearer $TOKEN" http://localhost:3000/api/v1/facility/tree
curl -s -H "authorization: Bearer $TOKEN" 'http://localhost:3000/api/v1/assets?limit=2'
curl -s -H "authorization: Bearer $TOKEN" http://localhost:3000/api/v1/scenes
```

Expected:

- health status `ok`
- facility response has `sites`
- assets response has `items`
- scenes response has `items`

- [ ] **Step 7: Commit**

```bash
cd /Users/ndiepdev/Developer/twin-database/backend
git add TASKS.md API.md docs/superpowers backend-app
git commit -m "feat: add phase 2 core read APIs"
```
