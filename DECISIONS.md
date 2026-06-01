# Twin@P.CN Backend Decisions

## ADR-001 — Modular monolith first

**Decision:** Build backend as modular monolith with clear domain modules.

**Why:** Existing DB schemas already separate domains. Core views require cross-domain joins: asset + facility + geometry + telemetry + alarm. Monolith reduces distributed complexity.

**Consequence:** Keep module boundaries strict. Split workers for ingest/simulation/notification before splitting APIs.

## ADR-002 — PostgreSQL + TimescaleDB + PostGIS as primary data store

**Decision:** Use existing `twin_db` as system-of-record.

**Why:** Schema already covers inventory, geometry, telemetry, alarms, simulation, integration, audit. TimescaleDB handles time-series; PostGIS handles spatial/3D needs.

**Consequence:** Avoid duplicate operational stores early. Add cache/search only when measured need appears.

## ADR-003 — Schema-per-domain maps to backend modules

**Decision:** Backend modules mirror DB schemas.

**Why:** Easier ownership, docs, permissions, migrations, query boundaries.

**Consequence:** Module list: `iam`, `facility`, `asset`, `geom3d`, `viewer`, `layer`, `telemetry`, `kpi`, `capacity`, `alarm`, `sop`, `cctv`, `history`, `sim`, `integration`, `audit`, `notification`.

## ADR-004 — REST for commands/queries, WebSocket/SSE for realtime

**Decision:** Use REST for CRUD/query APIs; WebSocket or SSE for realtime telemetry/alarm/simulation events.

**Why:** REST is simple for frontend and docs. Realtime channel needed for live digital twin.

**Consequence:** Events must have stable envelope: `version`, `type`, `timestamp`, `data`.

## ADR-005 — Cursor pagination for large resources

**Decision:** Use cursor pagination for lists and hypertable/event streams.

**Why:** Offset pagination becomes slow/unstable with time-series and high-volume data.

**Consequence:** All large list endpoints return `{ items, nextCursor }`.

## ADR-006 — Time bounds required for hypertable queries

**Decision:** All time-series APIs require `from` and `to`.

**Why:** Prevent accidental full hypertable scans.

**Consequence:** API rejects missing/invalid time bounds with `validation_failed`.

## ADR-007 — RBAC enforced at API and service level

**Decision:** Use `iam.role`, `iam.permission`, join tables for access control.

**Why:** Features include secure login, role-based access, view/action control.

**Consequence:** Route middleware checks coarse permission; service checks object/scope permission.

## ADR-008 — Audit security-sensitive actions

**Decision:** Write audit events for auth, RBAC, alarm lifecycle, connector config, simulation apply, SOP progress.

**Why:** Operational and security traceability.

**Consequence:** Mutating services receive actor context and write `audit.audit_event` in same transaction where possible.

## ADR-009 — Workers for heavy/asynchronous jobs

**Decision:** Use background workers for ingest, alarm evaluation, simulation, notifications.

**Why:** These tasks can be slow/high-volume and should not block request/response path.

**Consequence:** Workers share repository/service code; no duplicated business logic.

## ADR-010 — 3D payloads are metadata-first

**Decision:** Backend serves scene/mesh/texture/LOD metadata, not rendering logic.

**Why:** Rendering belongs to frontend/3D engine. Backend owns identity, URLs, asset mapping, permissions, visibility.

**Consequence:** Large binary assets should live in object storage/CDN later; DB stores metadata and references.

## ADR-011 — Simulation output stored separately from live state

**Decision:** Simulation writes to `sim.*`; live asset/capacity state changes only via explicit apply flow.

**Why:** What-if results must not mutate real operational state accidentally.

**Consequence:** Any apply action writes `sim.simulation_apply_log` and audit event.

## ADR-012 — Integration ingest accepts normalized canonical payload

**Decision:** External connectors map source-specific payloads to canonical telemetry ingest shape before write.

**Why:** BMS/EMS/DCIM/IoT payloads differ. Backend telemetry must stay consistent.

**Consequence:** Use `integration.sensor_binding` to map source points to asset/metric definitions.
