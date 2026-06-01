# Twin@P.CN Backend Architecture

## Architecture Style

Recommended backend: modular monolith first, clean service boundaries, async workers for ingest/simulation. Split to services later only after scale pressure is measured.

Why:

- Database already strongly domain-partitioned by schemas.
- Features need joins across facility, asset, geometry, telemetry, alarms.
- Early microservices would add distributed transactions and latency.
- Workers can isolate heavy workloads without splitting domain API.

## High-Level Components

```text
Client Web/3D/VR
  |
  | REST + WebSocket/SSE
  v
API Gateway / Backend App
  |-- Auth/RBAC Middleware
  |-- Domain Modules
  |-- Realtime Event Bus
  |-- Query Cache
  |
  | SQL
  v
PostgreSQL + TimescaleDB + PostGIS
  ^
  |
Workers
  |-- Telemetry Ingest Worker
  |-- Rule/Alarm Worker
  |-- Simulation Worker
  |-- Notification Worker
  |-- Retention/Aggregation Jobs
  ^
  |
External Systems: BMS / EMS / DCIM / IoT / VMS
```

## Runtime Modules

### Auth Module

Schemas: `iam`, `audit`.

Responsibilities:

- Login/logout/session refresh.
- API key validation for connectors.
- RBAC permission checks.
- User profile and role assignment.
- Audit security events.

### Facility Module

Schemas: `facility`.

Responsibilities:

- Physical hierarchy queries.
- Rack position lookup.
- Location search.
- Spatial grouping for 3D scenes and capacity.

### Asset Module

Schemas: `asset`, `facility`, `geom3d`.

Responsibilities:

- Asset inventory CRUD.
- Rack composition.
- Device details.
- Asset-to-position and asset-to-mesh lookup.
- Connection topology.

### Geometry/Viewer Module

Schemas: `geom3d`, `viewer`.

Responsibilities:

- Scene manifests.
- Mesh/texture metadata.
- LOD chains.
- Viewpoints and camera paths.
- User view presets.

### Layer Module

Schemas: `layer`, `telemetry`, `asset`.

Responsibilities:

- Layer type registry.
- Layer instance list.
- Thermal grid, airflow vector, power path data.
- User visibility/opacity state.

### Telemetry Module

Schemas: `telemetry`, `kpi`, `integration`.

Responsibilities:

- Metric definition registry.
- Metric sample write/read APIs.
- Time-range chart APIs.
- KPI sample APIs.
- Threshold evaluation input.

### Alarm Module

Schemas: `alarm`, `notification`, `sop`, `asset`, `cctv`, `history`.

Responsibilities:

- Alarm rule management.
- Alarm lifecycle: open, acknowledge, assign, resolve.
- Alarm correlation.
- Notification dispatch.
- SOP and CCTV suggestions.
- Real-time alarm stream.

### Capacity Module

Schemas: `capacity`, `facility`, `asset`, `telemetry`, `kpi`.

Responsibilities:

- Current capacity snapshot.
- Power/cooling/space remaining.
- Placement recommendations.
- Score explanations.

### History Module

Schemas: `history`, `telemetry`, `alarm`, `asset`.

Responsibilities:

- System snapshot lookup.
- Asset state timeline.
- Playback sessions.
- RCA case timeline.

### Simulation Module

Schemas: `sim`, `capacity`, `asset`, `telemetry`.

Responsibilities:

- Scenario CRUD.
- Simulation run orchestration.
- Result, timeseries, diff APIs.
- Apply-log tracking for accepted changes.

### Integration Module

Schemas: `integration`, `telemetry`, `audit`.

Responsibilities:

- Connector configuration.
- Sensor binding.
- Ingest log.
- Connector health.
- External auth/key rotation.

## Data Flow

### Client boot

1. Client authenticates.
2. Client fetches user profile and permissions.
3. Client fetches facility tree.
4. Client fetches active scene manifest.
5. Client fetches assets for visible area.
6. Client fetches default layers and user layer state.
7. Client opens realtime stream.

### Telemetry ingest

1. External connector receives source payload.
2. Ingest worker validates connector/API key.
3. Ingest worker maps external point to `integration.sensor_binding`.
4. Worker normalizes metric key/unit/value.
5. Worker writes `telemetry.metric_sample`.
6. Worker emits realtime event.
7. Alarm worker evaluates thresholds/rules.

### Alarm lifecycle

1. Rule creates alarm.
2. Backend writes `alarm.alarm` and initial `alarm.alarm_event_log`.
3. Notification worker dispatches channels.
4. API resolves impacted asset, 3D mesh, nearest CCTV, SOP.
5. User acknowledges/assigns/resolves.
6. Backend writes lifecycle events and audit entries.

### Time machine

1. User requests playback range.
2. Backend creates `history.playback_session`.
3. Backend queries snapshots, state changes, telemetry, alarms.
4. Backend returns frame chunks sorted by timestamp.
5. Client plays timeline and requests more frames on demand.

### Simulation

1. User creates scenario.
2. API validates permission and writes `sim.scenario`.
3. Worker runs simulation and updates `sim.simulation_run` status.
4. Worker writes results/timeseries/diffs.
5. API streams run status and returns final outputs.

## Realtime Strategy

Use WebSocket or SSE channel groups:

- `telemetry.asset.{asset_id}` — live metrics for selected asset.
- `telemetry.zone.{zone_id}` — live zone metrics.
- `alarm.global` — open/updated alarm events.
- `alarm.{alarm_id}` — lifecycle updates.
- `simulation.{run_id}` — simulation status/results.
- `connector.{connector_id}` — health events.

Rules:

- Auth required before subscription.
- Subscription scope checked against RBAC.
- Server throttles high-frequency telemetry.
- Payloads use stable event types and version field.

## Performance Strategy

- Use Timescale hypertables for time-series writes and range queries.
- Require `from`/`to` on time-series APIs.
- Downsample charts by interval.
- Use continuous aggregates for dashboards.
- Use spatial bounding/visible-area filters for 3D assets/layers.
- Use LOD for mesh metadata.
- Cache scene manifests and static catalogs.
- Use background workers for simulation and external ingestion.

## Security Strategy

- Passwords hashed with strong one-way algorithm.
- API keys stored hashed; plaintext shown once.
- JWT/session tokens short-lived; refresh via session table.
- RBAC enforced at route and service level.
- Audit all login, role changes, alarm lifecycle changes, simulation apply actions, connector config changes.
- No secrets in logs.
- TLS required outside local dev.

## Deployment Shape

Minimum local/dev:

```text
backend-api
postgres-timescale-postgis
```

Production recommended:

```text
load-balancer
backend-api replicas
worker-ingest replicas
worker-alarm replicas
worker-simulation replicas
worker-notification replicas
postgres/timescale HA
redis/event-bus optional
object-storage for 3D files optional
```

## Module Boundaries

- API handlers validate request and call services.
- Services enforce business rules and permissions.
- Repositories own SQL.
- Workers reuse services/repositories; no duplicate domain logic.
- Realtime publisher emits after DB commit.

## Failure Handling

- Ingest failures write `integration.ingest_log` with status/error.
- Connector failures update `integration.connector_health`.
- Simulation failures update `sim.simulation_run` status and error message.
- Notification failures write dispatch status and retry metadata.
- Alarm rule failures write platform metric and audit/system log.
