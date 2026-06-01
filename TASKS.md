# Twin@P.CN Backend Tasks

## Status Legend

- `[ ]` Not started.
- `[~]` In progress.
- `[x]` Done.

## Sprint 1 — Complete

Deliverable: frontend can login, load 3D scene context, click asset, see metrics and alarms.

### Sprint 1 Done

- [x] Foundation: DB connection, health, error format, logging.
- [x] Auth/RBAC: login, me, middleware.
- [x] Implement `POST /api/v1/auth/login`.
- [x] Implement `POST /api/v1/auth/logout`.
- [x] Implement `POST /api/v1/auth/refresh`.
- [x] Implement `GET /api/v1/me`.
- [x] Implement RBAC middleware using `iam.role`, `iam.permission`.
- [x] Implement `GET /api/v1/facility/tree`.
- [x] Implement `GET /api/v1/assets` with search/filter/pagination.
- [x] Implement `GET /api/v1/assets/{assetId}`.
- [x] Implement `GET /api/v1/scenes`.
- [x] Implement `GET /api/v1/scenes/{sceneId}/manifest`.
- [x] Implement `GET /api/v1/assets/{assetId}/metrics/latest`.
- [x] Implement `GET /api/v1/assets/{assetId}/metrics/timeseries`.
- [x] Implement `GET /api/v1/alarms`.
- [x] Implement `GET /api/v1/alarms/{alarmId}`.

### Sprint 1 Non-blocking / Carry-over

- [ ] Write audit entries for login/logout/permission changes.

## Sprint 2 — Suggested Implementation Plan

Goal: complete the remaining read/navigation surfaces around scene context, racks, layers, and incident helper details so the frontend can navigate deeper after Sprint 1.

### Sprint 2 Priority Tasks

- [ ] Implement `GET /api/v1/facility/rack-positions`.
- [ ] Implement `GET /api/v1/racks/{rackId}` with rack units, contained assets, capacity summary, and active alarm summary.
- [ ] Implement `GET /api/v1/scenes/{sceneId}/assets` with bounding-box filter for visible asset loading.
- [ ] Implement `GET /api/v1/viewpoints` for predefined navigation targets.
- [ ] Implement `POST /api/v1/view-presets` for user-saved camera/view presets.
- [ ] Implement `GET /api/v1/layers/types`.
- [ ] Implement `GET /api/v1/layers/instances`.
- [ ] Implement `GET /api/v1/layers/thermal`.
- [ ] Implement `GET /api/v1/layers/airflow`.
- [ ] Implement `GET /api/v1/layers/power-paths`.
- [ ] Implement `PUT /api/v1/users/me/layer-state`.
- [ ] Implement `GET /api/v1/alarms/{alarmId}/nearest-cameras`.
- [ ] Implement `GET /api/v1/alarms/{alarmId}/sop`.

### Sprint 2 Quality/Hardening Tasks

- [ ] Add unit tests for Sprint 1 telemetry and alarm service mapping/filter validation.
- [ ] Add E2E smoke tests for Sprint 1 metric and alarm read endpoints.
- [ ] Add permission tests for asset, telemetry, layer, and alarm read endpoints.
- [ ] Document Sprint 2 response shapes in `API.md` where implementation diverges from the draft.

## Phase 0 — Backend Foundation

- [x] Choose backend stack and framework.
- [x] Create backend source repository/folder structure.
- [x] Add database connection config for PostgreSQL/Timescale/PostGIS.
- [x] Add health endpoint: `GET /health`.
- [x] Add structured logging with request IDs.
- [x] Add global error handler using `API.md` error format.
- [x] Add request validation layer.
- [x] Add OpenAPI generation or API schema docs.

## Phase 1 — Auth & RBAC

- [x] Implement `POST /api/v1/auth/login`.
- [x] Implement `POST /api/v1/auth/logout`.
- [x] Implement `POST /api/v1/auth/refresh`.
- [x] Implement `GET /api/v1/me`.
- [x] Implement RBAC middleware using `iam.role`, `iam.permission`.
- [x] Implement API key auth foundation for integration endpoints.
- [ ] Write audit entries for login/logout/permission changes.
- [x] Add seed/admin user creation process.

## Phase 2 — Facility, Asset, Geometry

### Sprint 1 Scope — Core Read APIs

These are the Phase 2 APIs required by the Suggested First Sprint deliverable.

- [x] Implement `GET /api/v1/facility/tree`.
- [x] Implement `GET /api/v1/assets` with search/filter/pagination.
- [x] Implement `GET /api/v1/assets/{assetId}`.
- [x] Implement `GET /api/v1/scenes`.
- [x] Implement `GET /api/v1/scenes/{sceneId}/manifest`.

### Phase 2 Backlog — Post-Sprint 1

These APIs complete the broader Phase 2 scope but are not required for the first sprint deliverable.

- [ ] Implement `GET /api/v1/facility/rack-positions`.
- [ ] Implement `GET /api/v1/racks/{rackId}`.
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
- [x] Implement `GET /api/v1/assets/{assetId}/metrics/latest`.
- [x] Implement `GET /api/v1/assets/{assetId}/metrics/timeseries`.
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

- [x] Implement `GET /api/v1/alarms`.
- [x] Implement `GET /api/v1/alarms/{alarmId}`.
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
