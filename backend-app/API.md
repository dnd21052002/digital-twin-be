# Twin@P.CN Digital Twin — API Reference

Base path: `/api/v1`

Auth: `Bearer <accessToken>` via `/auth/login`.

Error envelope:
```json
{ "error": { "code": "not_found|unauthorized|forbidden|validation_failed", "message": "..." } }
```
Paginated list responses:
```json
{ "items": [...], "nextCursor": "string|uuid|null" }
```

---

## Assets

### `GET /assets`

Query: `q`, `category`, `status`, `siteId`, `buildingId`, `floorId`, `hallId`, `zoneId`, `rowId`, `cursor`, `limit` (1–100, default 50).

Response: `{ items: AssetSummary[], nextCursor }`

AssetSummary:
```json
{
  "id": "uuid", "assetTag": "string", "name": "string",
  "category": "string", "status": "string",
  "location": { "siteId": "uuid|null", "buildingId": "uuid|null",
    "floorId": "uuid|null", "hallId": "uuid|null", "zoneId": "uuid|null",
    "rowId": "uuid|null", "rackPositionId": "uuid|null" }
}
```

### `GET /assets/:assetId`

Response: `AssetDetail` with nested `category`, `model`, `geometry`, `location`, `attributes`.


## Telemetry

Requires `asset:read`.

### `GET /assets/:assetId/metrics/latest`

Response: `{ assetId, items: [{ metricKey, name, unit, value, quality, timestamp }] }`

### `GET /assets/:assetId/metrics/timeseries`

Query: `metric` (req), `from` (req, ISO8601), `to` (req, ISO8601), `interval?`, `limit?` (1–5000, default 1000).

Response: `{ assetId, metricKey, unit|null, from, to, interval|null, points: [{ timestamp, value, quality|null }] }`

---

## Alarms

Requires `alarm:read` for list/detail; separate perms for actions.

### `GET /alarms`

Query: `status`, `severity`, `assetId`, `from`, `to`, `cursor`, `limit` (1–100, default 50).

Response: `{ items: AlarmSummary[], nextCursor }`

AlarmSummary: `{ id, raisedAt, severity, state, title, message, currentValue, thresholdValue, asset: { id, assetTag, name, category } | null }`

### `GET /alarms/:alarmId`

Extends summary with: `rule`, `forecastValue`, `forecastHorizonMin`, `ackedBy`, `ackedAt`, `assignedTo`, `assignedAt`, `resolvedAt`, `resolutionNote`, `location`, `nearestCamera`, `sop`, `attributes`, `timeline`.

### `POST /alarms/:alarmId/acknowledge` — `alarm:acknowledge`
### `POST /alarms/:alarmId/assign` — `alarm:assign`
### `POST /alarms/:alarmId/resolve` — `alarm:resolve`

All return `{ ok: true }`.

### `GET /alarms/:alarmId/nearest-cameras` — `asset:read`
### `GET /alarms/:alarmId/sop` — `alarm:read`

---

## Racks

Requires `asset:read`.

### `GET /racks/:rackId`

Returns rack detail: `id`, `assetTag`, `name`, `category`, `status`, `location`, `capacity` (maxU, maxPowerKw), `units`, `containedAssets`, `activeAlarmSummary`.

---

## Scenes, Facility, Viewpoints

All require `asset:read`.

- `GET /scenes`
- `GET /scenes/:sceneId/assets` — supports `bbox` and `lod` query
- `GET /scenes/:sceneId/manifest`
- `GET /facility/tree`
- `GET /facility/rack-positions` — supports `rowId`, `zoneId`, `cursor`, `limit`
- `GET /viewpoints` — supports `sceneId`, `type`

---

## View Presets

Requires `asset:read`.

- `POST /view-presets` — body: `{ name, sceneId, state, thumbnailUrl?, tags? }`
- `GET /view-presets` — query: `sceneId`, `type`

---

## KPI & Capacity

Requires `asset:read`.

- `GET /kpi` — query: `siteId?`, `from?`, `to?`
- `GET /capacity/summary` — query: `siteId?`, `hallId?`
- `GET /capacity/trend` — query: `siteId?`, `hallId?`, `from?`, `to?`, `metric?`

---

## Auth & Me

- `POST /auth/login` — `{ identifier, password }` → `{ accessToken, refreshToken }`
- `POST /auth/refresh` — `{ refreshToken }` → `{ accessToken, refreshToken }`
- `POST /auth/logout` — requires auth
- `GET /me` — requires auth; returns user profile

## Health

- `GET /health` — `{ status: "ok", service, version }`
- `GET /health/db` — `{ status: "ok", database, user, extensions[], hypertables }`
