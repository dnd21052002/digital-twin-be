# Twin@P.CN Backend Conventions

## Naming

### API

- Base path: `/api/v1`.
- Resource names use kebab-case plural nouns: `/assets`, `/alarms`, `/playback-sessions`.
- Path params use `{camelCaseId}` in docs; actual framework may use `:assetId`.
- JSON keys use camelCase.
- Event types use dot-separated lowercase: `alarm.created`.

### Database

- Use existing schema names as domain boundaries.
- SQL identifiers use snake_case.
- UUID primary keys named `id`.
- Foreign keys named `<entity>_id`.
- Timestamp columns use `*_at` for entity lifecycle and `ts` for time-series samples/events.
- Never create new tables in `public` unless truly shared utility.

### Code

Recommended module names mirror schemas:

```text
src/modules/iam
src/modules/facility
src/modules/asset
src/modules/geom3d
src/modules/viewer
src/modules/layer
src/modules/telemetry
src/modules/kpi
src/modules/capacity
src/modules/alarm
src/modules/sop
src/modules/cctv
src/modules/history
src/modules/sim
src/modules/integration
src/modules/audit
src/modules/notification
```

## API Response Shape

Single object:

```json
{
  "id": "uuid",
  "name": "Rack A01"
}
```

List:

```json
{
  "items": [],
  "nextCursor": null
}
```

Mutation:

```json
{
  "id": "uuid",
  "status": "created"
}
```

Error:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "from must be before to",
    "details": {
      "field": "from"
    }
  }
}
```

## Time & Units

- All timestamps UTC ISO-8601 at API boundary.
- Store time-series in timestamptz.
- API must reject ambiguous local timestamps.
- Units must be explicit for telemetry values.
- Prefer SI units internally:
  - temperature: `celsius`
  - power: `kw`
  - energy: `kwh`
  - airflow: `m3_per_s`
  - humidity: `percent`
  - utilization: `percent`

## Pagination

Cursor pagination for large resources:

```text
GET /api/v1/assets?limit=50&cursor=...
```

Rules:

- Default limit: 50.
- Max limit: 500 for normal lists.
- Max limit: 5000 for internal/export-only endpoints.
- Cursor encodes stable sort fields.
- Never expose raw SQL offset for high-volume hypertables.

## Time-Series Query Rules

Every hypertable read endpoint must require:

- `from`
- `to`

Optional:

- `interval`
- `metric`
- `assetId`
- `zoneId`
- `limit`

Backend must enforce max windows:

| Query Type | Max Raw Window | Larger Window Behavior |
| --- | ---: | --- |
| Live metric raw samples | 24h | require `interval` |
| Dashboard charts | 30d | downsample/continuous aggregate |
| Audit search | 90d | cursor + filters required |
| Playback frames | 24h | chunked frame cursor |
| Simulation results | no fixed max | scoped by run id |

## Security

- All endpoints require auth unless explicitly marked public.
- RBAC checked before DB query where possible.
- Object-level permission checked for scoped resources.
- API keys only for integration ingest and service-to-service calls.
- Store hashed API keys, never plaintext after creation.
- Do not log passwords, tokens, API keys, raw auth headers.
- Audit:
  - login success/failure
  - logout
  - role/permission changes
  - alarm acknowledge/assign/resolve
  - connector create/update/delete
  - simulation apply
  - SOP execution updates

## SQL

- Use parameterized queries only.
- Keep SQL in repository/query layer.
- Avoid dynamic SQL. If needed, whitelist sortable/filterable columns.
- Add `LIMIT` to all list queries.
- Add time bounds to hypertable queries.
- Use transactions for multi-table mutations.
- Emit realtime event only after transaction commit.

## Realtime Events

Envelope:

```json
{
  "version": 1,
  "type": "alarm.updated",
  "timestamp": "2026-06-01T10:00:00Z",
  "data": {}
}
```

Rules:

- Event `version` required.
- Payloads must be backward-compatible within same version.
- Do not include secrets or hidden permission fields.
- Server validates subscription permission.
- High-frequency telemetry must be throttled/coalesced.

## Logging

Structured log fields:

```json
{
  "level": "info",
  "requestId": "uuid",
  "userId": "uuid",
  "module": "alarm",
  "action": "acknowledge",
  "resourceId": "uuid",
  "durationMs": 42
}
```

Rules:

- Include `requestId` on every request.
- Include `connectorId` on ingest logs.
- Include `runId` on simulation logs.
- Do not log full telemetry payloads at info level.
- Use warn/error for failed external calls.

## Validation

- Validate request schema at API boundary.
- Validate UUID format before service call.
- Validate enum values against DB/domain enums.
- Validate `from < to`.
- Validate simulation parameters by scenario type.
- Validate connector payload source point exists before ingest.

## Versioning

- API version in path: `/api/v1`.
- Event version in event envelope.
- Breaking API changes require `/api/v2`.
- Additive fields allowed in v1.
- Deprecated fields stay for one release cycle minimum.

## Documentation

- Every new endpoint updates `backend/API.md`.
- Every schema/table change updates `backend/DATABASE.md`.
- Every cross-cutting architecture choice updates `backend/DECISIONS.md`.
- Every new required env var updates `backend/ENV.md`.
- Every implemented backlog item updates `backend/TASKS.md`.
