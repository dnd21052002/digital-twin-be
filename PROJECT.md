# Twin@P.CN Backend Project

## Purpose

Backend powers Digital Twin for data center operations: 3D scene metadata, asset inventory, telemetry ingestion, alarms, capacity planning, CCTV correlation, SOP execution, historical playback, simulations, audit, notification.

## Scope

Backend responsibilities:

- Expose APIs for web/3D clients.
- Store canonical asset/facility/geometry data in PostgreSQL.
- Store time-series telemetry, alarms, audits, simulation outputs in TimescaleDB hypertables.
- Integrate BMS, EMS, DCIM, IoT sensors, VMS/CCTV.
- Provide RBAC auth and audit trail.
- Support real-time updates via WebSocket/SSE.
- Provide simulation, RCA, time-machine query surfaces.

Out of scope:

- 3D rendering engine implementation.
- Sensor firmware.
- External BMS/EMS/DCIM/VMS systems.
- ML model training pipelines.

## Product Inputs

Feature source: `Twin_P.CN_Features_Filtered.md`.

Major feature groups:

1. 3D Engine & Navigation.
2. Layered Data Integration.
3. Asset & Performance Monitoring.
4. Geospatial Alarming & Security.
5. Time Machine & Simulation.
6. System / Integration.
7. Security & Access Control.
8. System Use Cases.

## Database Baseline

Local Docker DB:

- Container: `twin-db`
- Image: `timescale/timescaledb-ha:pg16`
- Host: `localhost`
- Port: `5432`
- Database: `twin_db`
- Username: `twin`
- Password: `Twin@db`

Application schemas: 17.
Application tables: 79.
Timescale hypertables: 12.

## Backend Modules

| Module | Schemas | Purpose |
| --- | --- | --- |
| Identity | `iam` | Users, roles, sessions, API keys, permissions |
| Facility | `facility` | Site/building/floor/hall/zone/row/rack positions |
| Asset | `asset` | Racks, sensors, cameras, power/cooling units, connections |
| Geometry | `geom3d`, `viewer` | Scene, meshes, textures, viewpoints, camera paths |
| Layers | `layer` | Thermal, airflow, power-path, X-Ray overlays |
| Telemetry | `telemetry`, `kpi` | Real-time metrics, thresholds, events, KPI samples |
| Capacity | `capacity` | Capacity snapshots, placement recommendations |
| Alarm & SOP | `alarm`, `sop`, `notification` | Alarm lifecycle, correlation, dispatch, SOP execution |
| CCTV | `cctv` | Camera coverage, recordings, detection events |
| History | `history` | Time-machine snapshots, state changes, RCA cases |
| Simulation | `sim` | Scenarios, runs, results, timeseries, diffs |
| Integration | `integration` | Connectors, bindings, ingest logs, health |
| Audit | `audit` | Audit trail and platform metrics |

## Success Criteria

- Client can load facility → scene → assets → layers.
- Client can query current asset details and live metrics.
- Telemetry ingestion writes time-series data reliably.
- Alarms correlate to asset/location/CCTV/SOP.
- Time-machine queries reconstruct past state.
- Simulation APIs run what-if scenarios and return predicted impact.
- RBAC gates all read/write actions.
- Audit logs record security-sensitive actions.

## Related Docs

- `backend/FEATURES.md` — feature mapping.
- `backend/DATABASE.md` — DB structure.
- `backend/ARCHITECTURE.md` — backend architecture.
- `backend/API.md` — API contract draft.
- `backend/CONVENTIONS.md` — coding/data conventions.
- `backend/TASKS.md` — implementation backlog.
- `backend/DECISIONS.md` — architecture decisions.
- `backend/ENV.md` — env/config.
