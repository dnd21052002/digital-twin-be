# Twin@P.CN Backend Tasks

## Status Legend

- `[ ]` Not started.
- `[~]` In progress.
- `[x]` Done.

## Phase 0 — Backend Foundation

- [ ] Choose backend stack and framework.
- [ ] Create backend source repository/folder structure.
- [ ] Add database connection config for PostgreSQL/Timescale/PostGIS.
- [ ] Add migration/bootstrap strategy around existing `run_all.sql`.
- [ ] Add health endpoint: `GET /health`.
- [ ] Add structured logging with request IDs.
- [ ] Add global error handler using `API.md` error format.
- [ ] Add request validation layer.
- [ ] Add OpenAPI generation or API schema docs.

## Phase 1 — Auth & RBAC

- [ ] Implement `POST /api/v1/auth/login`.
- [ ] Implement `POST /api/v1/auth/logout`.
- [ ] Implement `POST /api/v1/auth/refresh`.
- [ ] Implement `GET /api/v1/me`.
- [ ] Implement RBAC middleware using `iam.role`, `iam.permission`.
- [ ] Implement API key auth for integration endpoints.
- [ ] Write audit entries for login/logout/permission changes.
- [ ] Add seed/admin user creation process.

## Phase 2 — Facility, Asset, Geometry

- [ ] Implement `GET /api/v1/facility/tree`.
- [ ] Implement `GET /api/v1/facility/rack-positions`.
- [ ] Implement `GET /api/v1/assets` with search/filter/pagination.
- [ ] Implement `GET /api/v1/assets/{assetId}`.
- [ ] Implement `GET /api/v1/racks/{rackId}`.
- [ ] Implement `GET /api/v1/scenes`.
- [ ] Implement `GET /api/v1/scenes/{sceneId}/manifest`.
- [ ] Implement `GET /api/v1/scenes/{sceneId}/assets` with bounding-box filter.
- [ ] Implement `GET /api/v1/viewpoints`.
- [ ] Implement `POST /api/v1/view-presets`.

## Phase 3 — Layers & Live Telemetry

- [ ] Implement `GET /api/v1/layers/types`.
- [ ] Implement `GET /api/v1/layers/instances`.
- [ ] Implement `GET /api/v1/layers/thermal`.
- [ ] Implement `GET /api/v1/layers/airflow`.
- [ ] Implement `GET /api/v1/layers/power-paths`.
- [ ] Implement `PUT /api/v1/users/me/layer-state`.
- [ ] Implement `GET /api/v1/assets/{assetId}/metrics/latest`.
- [ ] Implement `GET /api/v1/assets/{assetId}/metrics/timeseries`.
- [ ] Implement downsampling for chart queries.
- [ ] Implement realtime telemetry stream.

## Phase 4 — KPI & Capacity

- [ ] Implement `GET /api/v1/kpis/latest`.
- [ ] Implement `GET /api/v1/kpis/timeseries`.
- [ ] Implement `GET /api/v1/capacity/summary`.
- [ ] Implement `POST /api/v1/capacity/placement-recommendations`.
- [ ] Implement placement score explanation API payload.
- [ ] Add worker/job to refresh capacity snapshots.

## Phase 5 — Alarm, SOP, CCTV

- [ ] Implement `GET /api/v1/alarms`.
- [ ] Implement `GET /api/v1/alarms/{alarmId}`.
- [ ] Implement `POST /api/v1/alarms/{alarmId}/acknowledge`.
- [ ] Implement `POST /api/v1/alarms/{alarmId}/assign`.
- [ ] Implement `POST /api/v1/alarms/{alarmId}/resolve`.
- [ ] Implement `GET /api/v1/alarms/{alarmId}/nearest-cameras`.
- [ ] Implement `GET /api/v1/alarms/{alarmId}/sop`.
- [ ] Implement alarm rule evaluation worker.
- [ ] Implement notification dispatch worker.
- [ ] Implement realtime alarm events.

## Phase 6 — History & RCA

- [ ] Implement `POST /api/v1/history/playback-sessions`.
- [ ] Implement `GET /api/v1/history/playback-sessions/{sessionId}/frames`.
- [ ] Implement `GET /api/v1/rca-cases/{caseId}`.
- [ ] Add timeline frame chunking.
- [ ] Add historical telemetry downsampling.
- [ ] Add alarm-to-RCA case linking flow.

## Phase 7 — Simulation

- [ ] Implement `POST /api/v1/sim/scenarios`.
- [ ] Implement `POST /api/v1/sim/scenarios/{scenarioId}/runs`.
- [ ] Implement `GET /api/v1/sim/runs/{runId}`.
- [ ] Implement `GET /api/v1/sim/runs/{runId}/results`.
- [ ] Implement simulation worker skeleton.
- [ ] Implement cooling failure scenario.
- [ ] Implement load increase/new rack scenario.
- [ ] Implement simulation result overlay payload.

## Phase 8 — Integration

- [ ] Implement `GET /api/v1/integrations/connectors`.
- [ ] Implement `POST /api/v1/integrations/connectors`.
- [ ] Implement connector update/delete endpoints.
- [ ] Implement `GET /api/v1/integrations/connectors/{connectorId}/health`.
- [ ] Implement `POST /api/v1/integrations/ingest`.
- [ ] Implement sensor binding validation.
- [ ] Implement ingest error logging.
- [ ] Implement connector health monitor.

## Phase 9 — Hardening

- [ ] Add integration tests against Docker DB.
- [ ] Add load tests for telemetry write/read path.
- [ ] Add permission tests for every endpoint group.
- [ ] Add audit coverage tests.
- [ ] Add backup/restore runbook.
- [ ] Add retention/compression policy verification.
- [ ] Add observability dashboard for API latency, DB latency, ingest rate, alarm rate.

## Suggested First Sprint

1. Foundation: DB connection, health, error format, logging.
2. Auth/RBAC: login, me, middleware.
3. Read-only core APIs: facility tree, assets list/detail, scene manifest.
4. Telemetry latest/timeseries read APIs.
5. Alarm list/detail read APIs.

Deliverable: frontend can login, load 3D scene context, click asset, see metrics and alarms.
