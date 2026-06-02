# Sprint 2 Viewer Navigation Core Design

## Scope

Sprint 2 implements the backend read APIs needed for deeper 3D viewer navigation after Sprint 1.

Endpoints:

- `GET /api/v1/facility/rack-positions`
- `GET /api/v1/racks/{rackId}`
- `GET /api/v1/scenes/{sceneId}/assets`
- `GET /api/v1/viewpoints`

Out of scope:

- Database migrations.
- Realtime streams.
- Layer overlays.
- Alarm SOP/CCTV helper endpoints.
- Write APIs except existing auth/session behavior.

## Constraints

- Read existing database tables only.
- If a table or optional relation is unavailable, the API returns `[]` or `null` instead of failing.
- Response shapes follow `API.md` and add only fields needed by the frontend viewer.
- All endpoints require bearer auth and `asset:read`, matching Sprint 1 asset/scene endpoints.
- Swagger must expose all path/query parameters.

## Architecture

Use existing NestJS module patterns:

- Extend `facility` for rack position listing.
- Add a focused `racks` module for rack detail.
- Extend `scenes` for scene asset loading.
- Add a focused `viewer` module for viewpoints.

Each endpoint uses this flow:

1. Controller validates params/query through DTOs.
2. Service enforces resource existence and maps rows to API response.
3. Repository performs SQL queries through `DbService` and Kysely `sql`.
4. Missing optional data maps to `null` or `[]`.

## Endpoint Details

### `GET /api/v1/facility/rack-positions`

Purpose: return rack positions filtered by facility hierarchy.

Query parameters:

- `siteId?: string`
- `buildingId?: string`
- `floorId?: string`
- `hallId?: string`
- `zoneId?: string`
- `rowId?: string`
- `limit?: number` default `50`, max `100`
- `cursor?: string`

Response:

```json
{
  "items": [
    {
      "id": "uuid-or-text-id",
      "code": "A01",
      "positionIndex": 1,
      "maxU": 42,
      "maxPowerKw": 12.5,
      "currentRackId": "uuid-or-null",
      "location": {
        "siteId": "id-or-null",
        "buildingId": "id-or-null",
        "floorId": "id-or-null",
        "hallId": "id-or-null",
        "zoneId": "id-or-null",
        "rowId": "id-or-null"
      }
    }
  ],
  "nextCursor": null
}
```

Data source: `facility.rack_position` joined through `facility.row`, `facility.hall`, `facility.floor`, `facility.building`, and `facility.site`. Zone linkage is included when available from existing relationships.

### `GET /api/v1/racks/{rackId}`

Purpose: return rack-level detail for a clicked rack asset.

Path parameters:

- `rackId: string` asset id for a rack-like asset.

Response includes:

- rack asset identity and status
- model summary
- facility location
- rack position summary
- capacity summary
- rack units array
- contained assets array
- active alarm summary

If rack unit, contained asset, capacity, or alarm summary data cannot be derived from existing tables, those fields are `[]` or `null`.

Missing rack returns `404 not_found` with message `Rack not found`.

### `GET /api/v1/scenes/{sceneId}/assets`

Purpose: return assets visible in a scene, optionally constrained by a bounding box.

Path parameters:

- `sceneId: string`

Query parameters:

- `bbox?: string` in `minX,minY,minZ,maxX,maxY,maxZ` format
- `lod?: number`
- `limit?: number` default `500`, max `1000`
- `cursor?: string`

Behavior:

- The scene must exist.
- Without a scene-to-asset mapping table, assets are scoped by `scene.site_id` through facility joins.
- If `bbox` is provided and asset geometry exists, filter with PostGIS envelope intersection.
- If geometry is missing, return assets with `geometry.coordinates: null`.

Missing scene returns `404 not_found` with message `Scene not found`.

### `GET /api/v1/viewpoints`

Purpose: return predefined camera/navigation targets for the viewer.

Query parameters:

- `sceneId?: string`
- `type?: string`

Response:

```json
{
  "items": [
    {
      "id": "uuid-or-text-id",
      "sceneId": "uuid-or-null",
      "name": "UPS Room",
      "type": "asset",
      "target": {},
      "camera": {},
      "sortOrder": 10
    }
  ]
}
```

If `viewer.viewpoint` is unavailable, return `{ "items": [] }`.

## Error Handling

- Invalid UUID or malformed query: `400 validation_failed`.
- Missing bearer token: `401 unauthorized`.
- Missing `asset:read`: `403 permission_denied`.
- Missing rack or scene: `404 not_found`.
- Missing optional tables/relations: no error; return `[]` or `null`.

## Testing

Add e2e coverage for:

- rack position list shape and filters
- rack detail missing id returns 404
- scene assets missing scene returns 404
- scene assets returns list shape for an existing scene when fixture data exists
- viewpoints returns list shape and tolerates missing table
- Swagger documents new path/query parameters

Run verification:

- `npm run test:e2e -- --runInBand`
- `npm run build`
- Docker build/run smoke if requested before handoff

## Acceptance Criteria

- Branch `sprint-2` contains the implementation.
- All four endpoints are available under `/api/v1`.
- Endpoints use existing auth/RBAC guard stack and `asset:read`.
- Swagger UI allows entering all path/query params.
- E2E tests pass.
- API responses never crash because optional Sprint 2 tables are absent.
