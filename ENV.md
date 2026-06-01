# Twin@P.CN Backend Environment

## Local Database

Docker container:

```text
container=twin-db
image=timescale/timescaledb-ha:pg16
host=localhost
port=5432
database=twin_db
username=twin
password=Twin@db
```

Connection URL:

```bash
DATABASE_URL=postgresql://twin:Twin%40db@localhost:5432/twin_db
```

`@` in password must be URL-encoded as `%40`.

## Required Environment Variables

```bash
NODE_ENV=development
APP_ENV=local
APP_PORT=3000
APP_HOST=0.0.0.0
DATABASE_URL=postgresql://twin:Twin%40db@localhost:5432/twin_db
JWT_SECRET=change-me-local-secret
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=2592000
API_KEY_PEPPER=change-me-local-api-key-pepper
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
LOG_LEVEL=debug
```

If backend stack is not Node.js, keep same variable names where possible.

## Optional Environment Variables

```bash
REDIS_URL=redis://localhost:6379/0
REALTIME_TRANSPORT=ws
OBJECT_STORAGE_ENDPOINT=http://localhost:9000
OBJECT_STORAGE_BUCKET=twin-assets
OBJECT_STORAGE_ACCESS_KEY=minio
OBJECT_STORAGE_SECRET_KEY=minio-password
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
WEBHOOK_TIMEOUT_MS=5000
INGEST_BATCH_SIZE=1000
TELEMETRY_MAX_RAW_WINDOW_HOURS=24
QUERY_DEFAULT_LIMIT=50
QUERY_MAX_LIMIT=500
```

## Environment Profiles

### Local

Purpose: developer machine.

```bash
APP_ENV=local
LOG_LEVEL=debug
DATABASE_URL=postgresql://twin:Twin%40db@localhost:5432/twin_db
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Test

Purpose: automated tests.

```bash
APP_ENV=test
LOG_LEVEL=warn
DATABASE_URL=postgresql://twin:Twin%40db@localhost:5432/twin_db_test
JWT_SECRET=test-secret
```

Test DB should be isolated from local demo DB.

### Production

Purpose: deployed environment.

```bash
APP_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/twin_db
JWT_SECRET=<secret-from-secret-manager>
API_KEY_PEPPER=<secret-from-secret-manager>
CORS_ORIGINS=https://twin.example.com
```

Production rules:

- Never commit production secrets.
- Use secret manager or deployment secret store.
- Require TLS for app and DB connections.
- Disable debug logs.
- Use strong JWT/API key secrets.

## Docker Commands

Check DB container:

```bash
docker ps --filter name=twin-db
```

Open psql:

```bash
docker exec -it twin-db psql -U twin -d twin_db
```

Verify hypertables:

```bash
docker exec twin-db psql -U twin -d twin_db -c "SELECT hypertable_schema, hypertable_name FROM timescaledb_information.hypertables ORDER BY 1,2;"
```

List app schemas:

```bash
docker exec twin-db psql -U twin -d twin_db -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('iam','facility','asset','geom3d','viewer','layer','telemetry','kpi','capacity','alarm','sop','cctv','history','sim','integration','audit','notification') ORDER BY 1;"
```

## Database Bootstrap Notes

`run_all.sql` references files under `sql/...`:

```sql
\i sql/00_extensions.sql
\i sql/seed/99_column_comments.sql
```

Current repo stores SQL files at root plus `hypertables/` and `seed/`. Bootstrap needs either:

1. Repo layout adjusted to match `run_all.sql`, or
2. Temporary bootstrap folder with expected `sql/` structure.

Local DB was built with temporary layout.

## Secret Handling

- `.env` is local-only; do not commit.
- `.env.example` may contain variable names but no real secrets.
- Passwords/API keys/JWT secrets must not appear in logs.
- API keys stored hashed in DB.
- `DATABASE_URL` in docs may use local dev password only.

## Health Checks

Recommended endpoints:

```text
GET /health
GET /health/db
GET /health/realtime
```

Expected `/health` response:

```json
{
  "status": "ok",
  "service": "twin-backend",
  "version": "0.1.0"
}
```

Expected `/health/db` response:

```json
{
  "status": "ok",
  "database": "twin_db",
  "extensions": ["postgis", "postgis_topology", "timescaledb"],
  "hypertables": 12
}
```

## Local Dev Checklist

- [ ] Docker running.
- [ ] `twin-db` container running on port `5432`.
- [ ] `psql -h localhost -p 5432 -U twin -d twin_db` works.
- [ ] `DATABASE_URL` uses URL-encoded password: `Twin%40db`.
- [ ] Backend can run DB health query.
- [ ] CORS includes frontend dev origin.
- [ ] JWT/API key secrets set for local.
