# Backend Phase 2 Sprint 1 Core APIs Design

**Date:** 2026-06-01

## Goal

Implement backend Phase 2 Sprint 1 read-only core APIs so frontend can replace mock facility/assets/scenes data with real backend responses where DB data exists.

## Scope

Implement these authenticated endpoints:

1. `GET /api/v1/facility/tree`
2. `GET /api/v1/assets`
3. `GET /api/v1/assets/{assetId}`
4. `GET /api/v1/scenes`
5. `GET /api/v1/scenes/{sceneId}/manifest`

Do not implement remaining full Phase 2 endpoints in this slice: rack positions, rack detail, scene assets bounding-box query, viewpoints, view presets.

## Architecture

Add three focused NestJS modules under `backend-app/src/modules`:

- `facility`: physical hierarchy read model.
- `assets`: asset inventory list/detail read model.
- `scenes`: 3D scene list/manifest read model.

Each module has controller, service, repository, DTO/types where needed. Repositories use `DbService.db` and Kysely `sql` raw queries, matching existing `IamRepository` style. Controllers use existing `AuthGuard`; all endpoints require bearer auth. No write operations, no new DB migrations.

## Response design

### Facility tree

Return nested hierarchy:

```json
{
  "sites": [
    {
      "id": "1",
      "code": "PCN",
      "name": "Twin P.CN",
      "buildings": [
        {
          "id": "1",
          "code": "B1",
          "name": "Building 1",
          "floors": []
        }
      ]
    }
  ]
}
```

Facility tables use `bigint`, so IDs are strings in API responses. Empty child levels return empty arrays.

### Assets list

Support query params:

- `q`: case-insensitive search on asset tag/display name.
- `category`: exact `category_code`.
- `siteId`: filter through facility joins.
- `status`: exact enum text.
- `limit`: integer 1-100, default 50.
- `cursor`: keyset cursor, encoded asset id from previous page.

Return:

```json
{
  "items": [
    {
      "id": "uuid",
      "assetTag": "RACK-A01",
      "name": "Rack A01",
      "category": "rack",
      "status": "active",
      "location": {
        "siteId": "1",
        "buildingId": "1",
        "floorId": "1",
        "hallId": "1",
        "zoneId": "1",
        "rowId": "1",
        "rackPositionId": "1"
      }
    }
  ],
  "nextCursor": null
}
```

### Asset detail

Return asset core fields plus category/model/location/geometry summary:

```json
{
  "id": "uuid",
  "assetTag": "RACK-A01",
  "name": "Rack A01",
  "category": { "code": "rack", "name": "Rack" },
  "model": { "id": "1", "manufacturer": "Acme", "modelCode": "R42", "displayName": "Rack 42U" },
  "serialNo": "SN-1",
  "status": "active",
  "location": {
    "siteId": "1",
    "siteName": "Twin P.CN",
    "buildingId": "1",
    "floorId": "1",
    "hallId": "1",
    "zoneId": "1",
    "rowId": "1",
    "rackPositionId": "1"
  },
  "geometry": {
    "rotationDeg": 0,
    "coordinates": null
  },
  "attributes": {}
}
```

Missing asset returns 404.

### Scenes list and manifest

`GET /scenes` returns rows from `geom3d.scene`. Current seeded DB has zero scenes, so endpoint must return `{ "items": [] }` without error.

`GET /scenes/{sceneId}/manifest` returns scene metadata with mesh/texture arrays. Missing scene returns 404. Empty mesh/texture tables return empty arrays.

## Error handling

Use Nest exceptions so existing `HttpExceptionFilter` emits:

```json
{ "error": { "code": "not_found", "message": "Asset not found" } }
```

Validation failures use existing global `validation_failed` behavior.

## Tests

Extend e2e suite:

- Login as `e2e-admin`.
- `GET /facility/tree` returns 200 and `sites` array.
- `GET /assets?limit=5` returns 200, max 5 items, `nextCursor` present/null.
- `GET /assets/{assetId}` returns 200 for first listed asset.
- `GET /assets/not-a-uuid` returns 400 validation error.
- `GET /assets/{randomUuid}` returns 404.
- `GET /scenes` returns 200 and `items` array.
- `GET /scenes/{randomUuid}/manifest` returns 404 when no scene exists.

Run unit/e2e gates and Docker verification after implementation.

## Docker/update rule

After Phase 2 code and docs update:

1. Run `npm run lint`.
2. Run `npm run test`.
3. Run `npm run test:e2e`.
4. Run `npm run build`.
5. Build image `twin-backend-app:phase-2`.
6. Restart `twin-backend-app` with same env as Phase 1 and CORS including `http://localhost:8080`.
7. Verify health and Phase 2 endpoints via `curl`.
8. Update `backend/TASKS.md` marking Sprint 1 Phase 2 endpoints complete.
