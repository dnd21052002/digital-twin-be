# Twin@P.CN Backend API

## API Principles

- Base path: `/api/v1`.
- JSON request/response.
- UUID identifiers.
- ISO-8601 timestamps in UTC.
- Cursor pagination for large lists.
- Time-series endpoints require `from`, `to`, and optional `interval`.
- RBAC required for all non-public endpoints.
- Errors use stable machine-readable `code`.

## Auth

### `POST /api/v1/auth/login`

Login with username/email and password.

Request:

```json
{
  "identifier": "admin@example.com",
  "password": "secret"
}
```

Response:

```json
{
  "accessToken": "jwt",
  "refreshToken": "opaque-token",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "displayName": "Admin",
    "roles": ["admin"]
  }
}
```

DB: `iam.user`, `iam.session`, `iam.role`, `iam.user_role`.

### `POST /api/v1/auth/logout`

Invalidate current session. Requires `Authorization: Bearer <accessToken>`.

Response:

```json
{ "ok": true }
```

### `POST /api/v1/auth/refresh`

Refresh access and rotate refresh token.

Request:

```json
{ "refreshToken": "opaque-token" }
```

Response shape matches login.

### `GET /api/v1/me`

Return current user, roles, permissions. Requires bearer JWT.

DB: `iam.user`, `iam.permission`.

## Facility

### `GET /api/v1/facility/tree`

Return physical hierarchy.

Response:

```json
{
  "sites": [
    {
      "id": "uuid",
      "name": "Twin P.CN",
      "buildings": []
    }
  ]
}
```

DB: `facility.site`, `facility.building`, `facility.floor`, `facility.hall`, `facility.zone`, `facility.row`, `facility.rack_position`.

### `GET /api/v1/facility/rack-positions`

Query rack positions by site/floor/hall/zone/row.

Query:

```text
siteId=uuid&floorId=uuid&zoneId=uuid&limit=100&cursor=...
```

## Assets

### `GET /api/v1/assets`

List/search assets.

Query:

```text
q=ups&category=rack&siteId=uuid&status=active&limit=50&cursor=...
```

Response:

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
        "siteId": "uuid",
        "rackPositionId": "uuid"
      }
    }
  ],
  "nextCursor": "cursor-or-null"
}
```

DB: `asset.asset`, `asset.asset_category`, `facility.*`.

### `GET /api/v1/assets/{assetId}`

Get full asset detail.

Includes category, model, facility path, geometry, current alarms, latest metrics.

DB: `asset.*`, `facility.*`, `geom3d.mesh_asset`, `telemetry.metric_sample`, `alarm.alarm`.

### `GET /api/v1/racks/{rackId}`

Get rack detail, rack units, capacity snapshot, devices.

DB: `asset.rack`, `asset.rack_unit`, `capacity.capacity_snapshot`.

## Geometry & Viewer

### `GET /api/v1/scenes`

List available 3D scenes.

DB: `geom3d.scene`.

### `GET /api/v1/scenes/{sceneId}/manifest`

Return scene manifest with mesh/texture metadata and LOD.

DB: `geom3d.scene`, `geom3d.mesh_asset`, `geom3d.texture_asset`, `geom3d.mesh_lod_chain`.

### `GET /api/v1/scenes/{sceneId}/assets`

Return assets visible in scene/bounding box.

Query:

```text
bbox=minX,minY,minZ,maxX,maxY,maxZ&lod=2
```

### `GET /api/v1/viewpoints`

List jump points: UPS, generator, entrances, halls, zones.

DB: `viewer.viewpoint`.

### `POST /api/v1/view-presets`

Save user view preset.

DB: `viewer.user_view_preset`.

## Layers

### `GET /api/v1/layers/types`

List layer types: X-Ray, thermal, airflow, power path, alarm highlight.

DB: `layer.layer_type`.

### `GET /api/v1/layers/instances`

List active layer instances.

Query:

```text
sceneId=uuid&type=thermal
```

DB: `layer.layer_instance`.

### `GET /api/v1/layers/thermal`

Return thermal grid for time/current state.

Query:

```text
sceneId=uuid&at=2026-06-01T10:00:00Z
```

DB: `layer.thermal_grid_cell`, `telemetry.thermal_cell_sample`.

### `GET /api/v1/layers/airflow`

Return airflow vectors.

DB: `layer.airflow_vector`.

### `GET /api/v1/layers/power-paths`

Return power distribution paths.

DB: `layer.power_path_visual`, `asset.connection`.

### `PUT /api/v1/users/me/layer-state`

Persist user layer visibility/opacity.

Request:

```json
{
  "layerType": "thermal",
  "visible": true,
  "opacity": 0.65
}
```

DB: `layer.user_layer_state`.

## Telemetry & KPI

### `GET /api/v1/assets/{assetId}/metrics/latest`

Return latest metric per metric key.

DB: `telemetry.metric_sample`.

### `GET /api/v1/assets/{assetId}/metrics/timeseries`

Query chart data.

Query:

```text
metric=temperature&from=2026-06-01T00:00:00Z&to=2026-06-01T01:00:00Z&interval=1m
```

DB: `telemetry.metric_sample`.

### `GET /api/v1/kpis/latest`

Return latest PUE/WUE and other KPIs.

DB: `kpi.kpi_sample`, `kpi.kpi_definition`.

### `GET /api/v1/kpis/timeseries`

Return KPI trend.

DB: `kpi.kpi_sample`.

## Capacity

### `GET /api/v1/capacity/summary`

Return power, cooling, space capacity by site/floor/hall/zone.

DB: `capacity.capacity_snapshot`.

### `POST /api/v1/capacity/placement-recommendations`

Create placement recommendation for new rack/device.

Request:

```json
{
  "siteId": "uuid",
  "requiredKw": 8.5,
  "requiredCoolingKw": 9.2,
  "rackUnits": 42,
  "redundancy": "N+1"
}
```

Response:

```json
{
  "recommendationId": "uuid",
  "items": [
    {
      "rackPositionId": "uuid",
      "score": 92.4,
      "reasons": ["power_available", "cooling_available", "low_heat_risk"]
    }
  ]
}
```

DB: `capacity.placement_recommendation`, `capacity.placement_score_detail`.

## Alarms, SOP, CCTV

### `GET /api/v1/alarms`

List alarms.

Query:

```text
status=open&severity=critical&from=...&to=...&limit=50&cursor=...
```

DB: `alarm.alarm`.

### `GET /api/v1/alarms/{alarmId}`

Get alarm detail with asset, location, CCTV, SOP, timeline.

DB: `alarm.*`, `asset.*`, `facility.*`, `cctv.*`, `sop.*`, `history.rca_event_timeline`.

### `POST /api/v1/alarms/{alarmId}/acknowledge`

Acknowledge alarm.

Request:

```json
{
  "comment": "Investigating on site"
}
```

DB: `alarm.alarm_event_log`, `audit.audit_event`.

### `POST /api/v1/alarms/{alarmId}/assign`

Assign owner.

Request:

```json
{
  "assigneeUserId": "uuid"
}
```

### `POST /api/v1/alarms/{alarmId}/resolve`

Resolve alarm.

Request:

```json
{
  "resolution": "Replaced failed fan unit"
}
```

### `GET /api/v1/alarms/{alarmId}/nearest-cameras`

Return nearest CCTV cameras/coverage.

DB: `cctv.camera_zone_coverage`, `asset.camera`.

### `GET /api/v1/alarms/{alarmId}/sop`

Return recommended SOP.

DB: `sop.sop_document`, `sop.sop_step`.

## History & RCA

### `POST /api/v1/history/playback-sessions`

Create playback session.

Request:

```json
{
  "from": "2026-06-01T00:00:00Z",
  "to": "2026-06-01T01:00:00Z",
  "scope": {
    "siteId": "uuid",
    "assetIds": ["uuid"]
  }
}
```

DB: `history.playback_session`.

### `GET /api/v1/history/playback-sessions/{sessionId}/frames`

Return timeline frames.

DB: `history.system_snapshot`, `history.asset_state_change`, `telemetry.metric_sample`, `alarm.alarm`.

### `GET /api/v1/rca-cases/{caseId}`

Return RCA case and event timeline.

DB: `history.rca_case`, `history.rca_event_timeline`.

## Simulation

### `POST /api/v1/sim/scenarios`

Create what-if scenario.

Request:

```json
{
  "name": "Cooling Unit A failure",
  "type": "cooling_failure",
  "scope": { "zoneId": "uuid" },
  "parameters": {
    "failedCoolingUnitId": "uuid",
    "durationMinutes": 30
  }
}
```

DB: `sim.scenario`.

### `POST /api/v1/sim/scenarios/{scenarioId}/runs`

Start simulation run.

DB: `sim.simulation_run`.

### `GET /api/v1/sim/runs/{runId}`

Get run status.

### `GET /api/v1/sim/runs/{runId}/results`

Get predicted outputs.

DB: `sim.simulation_result`, `sim.simulation_timeseries`, `sim.simulation_diff`.

## Integration

### `GET /api/v1/integrations/connectors`

List connectors.

DB: `integration.connector`.

### `POST /api/v1/integrations/connectors`

Create connector.

### `GET /api/v1/integrations/connectors/{connectorId}/health`

Get connector health timeline/latest.

DB: `integration.connector_health`.

### `POST /api/v1/integrations/ingest`

Ingest telemetry from external connector.

Auth: API key.

Request:

```json
{
  "sourcePointId": "BMS.TEMP.RACK_A01",
  "timestamp": "2026-06-01T10:00:00Z",
  "value": 27.4,
  "unit": "celsius"
}
```

DB: `integration.sensor_binding`, `telemetry.metric_sample`, `integration.ingest_log`.

## Realtime API

Endpoint: `/api/v1/realtime`.

Transport: WebSocket or SSE.

Event envelope:

```json
{
  "version": 1,
  "type": "telemetry.metric.updated",
  "timestamp": "2026-06-01T10:00:00Z",
  "data": {}
}
```

Event types:

- `telemetry.metric.updated`
- `telemetry.thermal.updated`
- `alarm.created`
- `alarm.updated`
- `alarm.resolved`
- `simulation.run.updated`
- `connector.health.updated`
- `notification.created`

## Error Format

```json
{
  "error": {
    "code": "permission_denied",
    "message": "Missing permission: alarm.write",
    "details": {
      "permission": "alarm.write"
    }
  }
}
```

Common codes:

- `invalid_request`
- `unauthorized`
- `permission_denied`
- `not_found`
- `conflict`
- `rate_limited`
- `validation_failed`
- `connector_unavailable`
- `simulation_failed`
- `internal_error`
