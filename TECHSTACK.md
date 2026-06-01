# Twin@P.CN Backend Tech Stack

## Recommendation

Use **NestJS + TypeScript** as core backend for Phase 0 and first product backend.

Reason: digital-twin backend needs modular domains, auth/RBAC, REST APIs, realtime events, background workers, DB-heavy queries, OpenAPI docs. NestJS maps cleanly to existing database schemas and backend docs.

## Core Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Runtime | Node.js LTS | Strong TypeScript ecosystem, fast API development |
| Language | TypeScript | Typed API contracts, safer refactor, frontend/backend shared types later |
| Framework | NestJS | Module system, guards, interceptors, DI, OpenAPI, WebSocket support |
| Database | PostgreSQL 16 + TimescaleDB + PostGIS | Existing DB uses schemas, hypertables, spatial/3D support |
| SQL Access | Kysely or Drizzle | Typed SQL while keeping control over existing schema/hypertables |
| Validation | Zod or class-validator | Request/env validation |
| API Docs | OpenAPI/Swagger | Contract for frontend and integration clients |
| Auth | JWT access token + DB-backed session/refresh token | Works with `iam.session`, supports revoke/logout |
| RBAC | Guards + `iam.role`/`iam.permission` | Matches DB design |
| Realtime | WebSocket or SSE | Live telemetry, alarms, simulation status |
| Workers | BullMQ + Redis later | Async ingest, alarm evaluation, notification, simulation |
| Logging | Pino | Structured logs, low overhead |
| Testing | Vitest/Jest + Supertest | Unit/integration/API tests |
| Deployment | Docker | Consistent local/prod runtime |

## Why NestJS

Digital-twin domains map naturally to NestJS modules:

```text
iam           -> Auth/RBAC/session/API key
facility      -> site/building/floor/hall/zone/row/rack position
asset         -> inventory, rack, sensor, camera, power/cooling
geom3d/viewer -> scene, mesh, LOD, viewpoints
layer         -> thermal/airflow/power/X-Ray overlays
telemetry/kpi -> metrics, charts, thresholds, PUE/WUE
capacity      -> capacity snapshots, placement recommendation
alarm/sop     -> incident lifecycle and SOP execution
cctv          -> camera coverage, recordings, detections
history       -> playback and RCA
sim           -> what-if scenario and simulation result
integration   -> BMS/EMS/DCIM/IoT/VMS connectors
audit         -> audit trail and platform metrics
notification  -> user notification inbox
```

NestJS strengths:

- Modules enforce domain boundaries.
- Guards fit auth/RBAC.
- Pipes fit validation.
- Interceptors fit logging/audit/response shaping.
- OpenAPI integration reduces API drift.
- WebSocket gateway supports realtime UI.
- Queue packages support workers later.

## SQL Layer Choice

### Recommended: Kysely

Use Kysely if priority is SQL control and existing DB compatibility.

Pros:

- Strong typed SQL builder.
- Easy joins across schemas.
- Good for hand-written complex queries.
- Minimal ORM magic.
- Works well with existing tables, TimescaleDB, PostGIS SQL.

Cons:

- Need define DB types manually or generate types.
- No full ORM relations.

### Alternative: Drizzle

Use Drizzle if priority is schema-as-code and typed models.

Pros:

- Good TypeScript types.
- Lightweight.
- Migration support.

Cons:

- Existing DB/hypertables/Timescale/PostGIS may need custom SQL handling.

### Avoid initially: Prisma

Prisma is productive for simple CRUD, but less ideal here:

- Existing multi-schema DB.
- Timescale hypertables.
- PostGIS functions.
- Complex analytical/time-series queries.

## Architecture Shape

Phase 0 target:

```text
backend/
  src/
    main.ts
    app.module.ts
    config/
    db/
    common/
      errors/
      logging/
      validation/
    modules/
      health/
      iam/
      facility/
      asset/
      telemetry/
      alarm/
  test/
  package.json
  tsconfig.json
  Dockerfile
  .env.example
```

Runtime:

```text
Client
  -> REST /api/v1
  -> WebSocket/SSE /api/v1/realtime
Backend API
  -> PostgreSQL/Timescale/PostGIS
Workers later
  -> Redis/BullMQ later
External connectors later
  -> BMS/EMS/DCIM/IoT/VMS
```

## Phase 0 Minimal Deliverable

Build only foundation:

- NestJS app boots.
- Env config validates required vars.
- DB connection works against `twin_db`.
- `GET /health` returns app status.
- `GET /health/db` checks DB, required extensions, hypertable count.
- Global error format matches `backend/API.md`.
- Structured logging enabled.
- Swagger/OpenAPI enabled in local dev.
- `.env.example` documents local DB config.

No feature modules beyond skeleton/readiness.

## Future Additions

Add only when needed:

| Need | Add |
| --- | --- |
| Background jobs | Redis + BullMQ |
| High-rate ingest | Kafka/NATS/RabbitMQ |
| Cache hot metadata | Redis |
| Object storage for 3D files | S3/MinIO |
| Search | PostgreSQL trigram first, OpenSearch later if needed |
| Heavy simulation | Python worker service |
| Enterprise SSO | OIDC/SAML |

## Digital Twin Industry Pattern Mapping

| Industry Pattern | This Project |
| --- | --- |
| Twin graph/entity model | `facility`, `asset`, `geom3d`, `layer` |
| Time-series telemetry | `telemetry`, `kpi`, TimescaleDB hypertables |
| Event routing | Realtime API now, queue/event bus later |
| Connectors | `integration.connector`, `sensor_binding`, `ingest_log` |
| 3D scenes | `geom3d.scene`, `mesh_asset`, `texture_asset`, `viewer` |
| Alarms | `alarm`, `notification`, `sop`, `cctv` |
| Historical replay | `history`, Timescale queries |
| Simulation | `sim` tables + async worker later |

## Decision

Use:

```text
NestJS + TypeScript + Kysely + PostgreSQL/Timescale/PostGIS
```

Defer:

```text
Redis/BullMQ, Kafka/NATS, object storage, Python simulation worker
```

Reason: Phase 0 needs stable backend foundation, not distributed infrastructure.
