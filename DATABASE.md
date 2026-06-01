# Twin@P.CN Database

## Connection

Local Docker:

```text
host=localhost
port=5432
database=twin_db
user=twin
password=Twin@db
```

CLI:

```bash
psql -h localhost -p 5432 -U twin -d twin_db
```

Docker:

```bash
docker exec -it twin-db psql -U twin -d twin_db
```

## Extensions

Required extensions:

- `pgcrypto` — UUID and crypto helpers.
- `citext` — case-insensitive text for auth/user fields.
- `btree_gin` — composite indexing.
- `pg_trgm` — fuzzy search.
- `postgis` — 3D/spatial geometry.
- `postgis_topology` — topology support.
- `timescaledb` — hypertables and time-series policies.

## Application Schemas

17 application schemas:

| Schema | Table Count | Purpose |
| --- | ---: | --- |
| `iam` | 7 | Auth, RBAC, sessions, API keys |
| `facility` | 7 | Physical hierarchy: site → building → floor → hall → zone/row/rack position |
| `asset` | 10 | Devices, racks, sensors, cameras, power/cooling, connections |
| `geom3d` | 4 | 3D scenes, meshes, textures, LOD chains |
| `viewer` | 3 | Viewpoints, camera paths, user presets |
| `layer` | 6 | Thermal, airflow, power path, X-Ray, user layer state |
| `telemetry` | 5 | Metric definitions, samples, thresholds, event stream, thermal samples |
| `kpi` | 3 | KPI definitions, samples, targets |
| `capacity` | 3 | Capacity snapshots and placement recommendations |
| `alarm` | 6 | Alarm rules, alarms, correlation, event log, notification dispatch |
| `sop` | 4 | SOP documents, steps, executions, progress |
| `cctv` | 3 | Camera coverage, recordings, detections |
| `history` | 5 | State changes, snapshots, playback sessions, RCA |
| `sim` | 6 | Scenarios, runs, results, timeseries, diffs |
| `integration` | 4 | Connectors, sensor bindings, ingest logs, health |
| `audit` | 2 | Audit events, platform metrics |
| `notification` | 1 | User notifications |

## Tables by Schema

### `iam`

- `iam.user`
- `iam.role`
- `iam.permission`
- `iam.user_role`
- `iam.role_permission`
- `iam.session`
- `iam.api_key`

Use for login, RBAC, token/session validation, service API keys.

### `facility`

- `facility.site`
- `facility.building`
- `facility.floor`
- `facility.hall`
- `facility.zone`
- `facility.row`
- `facility.rack_position`

Use for physical containment and location queries.

### `asset`

- `asset.asset`
- `asset.asset_category`
- `asset.asset_model`
- `asset.rack`
- `asset.rack_unit`
- `asset.sensor`
- `asset.camera`
- `asset.power_unit`
- `asset.cooling_unit`
- `asset.connection`

Use for inventory, device details, rack composition, topology.

### `geom3d`

- `geom3d.scene`
- `geom3d.mesh_asset`
- `geom3d.texture_asset`
- `geom3d.mesh_lod_chain`

Use for 3D model metadata and LOD.

### `viewer`

- `viewer.viewpoint`
- `viewer.camera_path`
- `viewer.user_view_preset`

Use for navigation presets and saved views.

### `layer`

- `layer.layer_type`
- `layer.layer_instance`
- `layer.thermal_grid_cell`
- `layer.airflow_vector`
- `layer.power_path_visual`
- `layer.user_layer_state`

Use for overlay rendering and layer preferences.

### `telemetry`

- `telemetry.metric_definition`
- `telemetry.metric_sample` — hypertable.
- `telemetry.metric_threshold`
- `telemetry.event_stream` — hypertable.
- `telemetry.thermal_cell_sample` — hypertable.

Use for live metrics, charts, thresholds, thermal data.

### `kpi`

- `kpi.kpi_definition`
- `kpi.kpi_sample` — hypertable.
- `kpi.kpi_target_period`

Use for PUE/WUE and operational KPIs.

### `capacity`

- `capacity.capacity_snapshot`
- `capacity.placement_recommendation`
- `capacity.placement_score_detail`

Use for power/cooling/space availability and rack placement.

### `alarm`

- `alarm.alarm_rule`
- `alarm.alarm` — hypertable.
- `alarm.alarm_event_log`
- `alarm.alarm_correlation`
- `alarm.notification_channel`
- `alarm.notification_dispatch`

Use for incident detection, lifecycle, correlation, dispatch.

### `sop`

- `sop.sop_document`
- `sop.sop_step`
- `sop.sop_execution`
- `sop.sop_step_progress`

Use for incident handling guidance and progress tracking.

### `cctv`

- `cctv.camera_zone_coverage`
- `cctv.recording`
- `cctv.detection_event` — hypertable.

Use for alarm-nearby cameras and detection overlays.

### `history`

- `history.asset_state_change` — hypertable.
- `history.system_snapshot`
- `history.playback_session`
- `history.rca_case`
- `history.rca_event_timeline`

Use for time machine, replay, root cause analysis.

### `sim`

- `sim.scenario`
- `sim.simulation_run`
- `sim.simulation_result`
- `sim.simulation_timeseries` — hypertable.
- `sim.simulation_diff`
- `sim.simulation_apply_log`

Use for what-if scenario execution and predicted outputs.

### `integration`

- `integration.connector`
- `integration.sensor_binding`
- `integration.ingest_log` — hypertable.
- `integration.connector_health` — hypertable.

Use for BMS/EMS/DCIM/IoT/VMS connector health and ingestion.

### `audit`

- `audit.audit_event` — hypertable.
- `audit.platform_metric` — hypertable.

Use for security audit and backend ops metrics.

### `notification`

- `notification.user_notification`

Use for user-facing notification inbox.

## Hypertables

12 Timescale hypertables:

| Hypertable | Purpose |
| --- | --- |
| `telemetry.metric_sample` | Numeric/device metrics over time |
| `telemetry.event_stream` | Raw/event telemetry stream |
| `telemetry.thermal_cell_sample` | Thermal grid history |
| `kpi.kpi_sample` | KPI values over time |
| `alarm.alarm` | Alarm time-series lifecycle root |
| `cctv.detection_event` | Video analytics detections |
| `history.asset_state_change` | Asset state changes over time |
| `sim.simulation_timeseries` | Simulation output time-series |
| `integration.ingest_log` | Connector ingest events |
| `integration.connector_health` | Connector health samples |
| `audit.audit_event` | Audit trail |
| `audit.platform_metric` | Backend/platform metrics |

## Query Patterns

### List app tables

```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
  AND table_schema IN (
    'iam','facility','asset','geom3d','viewer','layer','telemetry','kpi',
    'capacity','alarm','sop','cctv','history','sim','integration','audit','notification'
  )
ORDER BY table_schema, table_name;
```

### List hypertables

```sql
SELECT hypertable_schema, hypertable_name, num_chunks
FROM timescaledb_information.hypertables
ORDER BY 1, 2;
```

### Asset detail base query

```sql
SELECT a.*, c.name AS category_name, m.name AS model_name
FROM asset.asset a
LEFT JOIN asset.asset_category c ON c.id = a.category_id
LEFT JOIN asset.asset_model m ON m.id = a.model_id
WHERE a.id = $1;
```

### Latest metric per asset

```sql
SELECT DISTINCT ON (asset_id, metric_key)
  asset_id, metric_key, ts, value_num, unit
FROM telemetry.metric_sample
WHERE asset_id = $1
ORDER BY asset_id, metric_key, ts DESC;
```

### Alarm list with asset

```sql
SELECT al.*, a.name AS asset_name, a.asset_tag
FROM alarm.alarm al
LEFT JOIN asset.asset a ON a.id = al.asset_id
ORDER BY al.ts DESC
LIMIT $1 OFFSET $2;
```

## Data Access Rules

- Never expose system schemas directly.
- All API queries must filter by permission scope.
- Use parameterized SQL only.
- Use pagination for list endpoints.
- Use time bounds for hypertable queries.
- Use server-side limits for map/3D/telemetry payloads.
- Audit write actions and security-sensitive reads.
