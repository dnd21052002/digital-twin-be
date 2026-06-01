# Twin@P.CN Backend Features

Source: `Twin_P.CN_Features_Filtered.md`.

## Feature Matrix

| Feature Group | User Need | Backend Capability | Primary Schemas |
| --- | --- | --- | --- |
| 3D Engine & Navigation | View high-detail full data center 3D model | Scene/mesh/texture APIs, asset-to-mesh mapping, LOD metadata | `geom3d`, `asset`, `facility` |
| 3D Engine & Navigation | Fly/walk navigation | Viewpoint presets, camera paths, user view presets | `viewer` |
| 3D Engine & Navigation | Jump to UPS/generator/entrance | Named viewpoints and asset/location lookup | `viewer`, `asset`, `facility` |
| 3D Engine & Navigation | Smooth rotate/zoom/pan | Backend serves optimized scene chunks and LOD metadata | `geom3d`, `viewer` |
| 3D Engine & Navigation | Click equipment for details | Asset detail API with facility, telemetry, alarm, SOP joins | `asset`, `facility`, `telemetry`, `alarm`, `sop` |
| Layered Data Integration | Toggle X-Ray layer | Layer metadata, per-user layer state, opacity settings | `layer` |
| Layered Data Integration | Real-time thermal map | Thermal grid cells + telemetry thermal hypertables | `layer`, `telemetry` |
| Layered Data Integration | Airflow visualization | Airflow vectors and computed layer instances | `layer` |
| Layered Data Integration | Power distribution path | Power path visual graph from source to rack | `layer`, `asset` |
| Layered Data Integration | Adjust layer opacity | User layer state persistence | `layer.user_layer_state` |
| Asset & Performance Monitoring | Rack detail panel | Rack API, rack units, contained assets, capacity, alarms | `asset`, `capacity`, `alarm` |
| Asset & Performance Monitoring | CPU/RAM/GPU/disk/temp/power live metrics | Metric definitions, samples, thresholds, real-time stream | `telemetry` |
| Asset & Performance Monitoring | Trend charts | Time-range queries over hypertables and continuous aggregates | `telemetry`, `kpi` |
| Asset & Performance Monitoring | PUE/WUE sustainability | KPI definitions, targets, samples | `kpi` |
| Asset & Performance Monitoring | Recommend rack placement | Capacity snapshots, placement recommendation scoring | `capacity` |
| Asset & Performance Monitoring | Know power/cooling/space remaining | Capacity read models | `capacity`, `asset`, `facility` |
| Geospatial Alarming & Security | Immediate incident alerts | Alarm rules, alarm hypertable, notification dispatch | `alarm`, `notification` |
| Geospatial Alarming & Security | Show exact fault location in 3D | Alarm → asset/location/mesh mapping | `alarm`, `asset`, `geom3d`, `facility` |
| Geospatial Alarming & Security | Highlight fault area | Layer instance for alarm overlays | `alarm`, `layer` |
| Geospatial Alarming & Security | Show nearest CCTV | Camera coverage, camera asset, alarm location correlation | `cctv`, `asset`, `alarm` |
| Geospatial Alarming & Security | Read SOP at incident point | SOP document/step lookup by alarm type/asset/category | `sop`, `alarm`, `asset` |
| Geospatial Alarming & Security | Acknowledge/assign/update incident | Alarm lifecycle API and event log | `alarm`, `iam`, `audit` |
| Time Machine & Simulation | View historical system state | Snapshot and state-change queries | `history`, `telemetry` |
| Time Machine & Simulation | Replay incident timeline | Playback session and RCA timeline APIs | `history`, `alarm`, `telemetry` |
| Time Machine & Simulation | Root cause analysis | RCA case and event timeline correlation | `history`, `alarm`, `integration` |
| Time Machine & Simulation | Run what-if simulation | Scenario/run APIs and async execution | `sim` |
| Time Machine & Simulation | Cooling failure impact | Simulation scenario templates + result timeseries | `sim`, `asset`, `telemetry` |
| Time Machine & Simulation | Load increase/new device impact | Placement + simulation integration | `sim`, `capacity`, `asset` |
| Time Machine & Simulation | Predicted temp/power/risk | Simulation results, diffs, timeseries | `sim` |
| System / Integration | Auto-ingest BMS/EMS/DCIM/IoT | Connector config, sensor bindings, ingest logs | `integration`, `telemetry` |
| System / Integration | Real-time data updates | Ingest pipeline + pub/sub stream | `integration`, `telemetry` |
| System / Integration | Web/tablet/VR/AR access | REST + real-time APIs with device-neutral payloads | all read APIs |
| System / Integration | Smooth with large 3D model | Pagination, LOD, spatial filtering, cache headers | `geom3d`, `asset`, `facility` |
| Security & Access Control | Secure login | Session and API key auth | `iam` |
| Security & Access Control | RBAC | Role/permission model | `iam` |
| Security & Access Control | Control view/action access | Permission checks per route and action | `iam`, `audit` |
| Security & Access Control | Encrypted/secure data | TLS, hashed secrets, no secret logging, audit | `iam`, `audit` |

## System Use Cases

### Telemetry auto-update

Flow:

1. Connector fetches/pushes external values.
2. Backend validates source via `integration.connector` and `integration.sensor_binding`.
3. Backend resolves metric via `telemetry.metric_definition`.
4. Backend writes sample to `telemetry.metric_sample`.
5. Backend publishes live event to subscribers.

### Anomaly detection → alarm

Flow:

1. Metric sample arrives.
2. Threshold/rule evaluation checks `telemetry.metric_threshold` and `alarm.alarm_rule`.
3. Backend writes `alarm.alarm` and `alarm.alarm_event_log`.
4. Notification dispatch writes `alarm.notification_dispatch` and `notification.user_notification`.
5. Client receives real-time alarm event.

### Fault highlight on 3D model

Flow:

1. Alarm references asset/location.
2. Backend resolves facility position and `geom3d.mesh_asset`.
3. Backend emits alarm overlay layer instance.
4. Client highlights mesh/zone/rack and opens alarm panel.

### Optimal placement recommendation

Flow:

1. User submits new rack/load requirements.
2. Backend reads `capacity.capacity_snapshot` and facility positions.
3. Backend scores candidate positions.
4. Backend writes `capacity.placement_recommendation` and `capacity.placement_score_detail`.
5. Client shows ranked positions in 3D.

### Historical replay

Flow:

1. User selects time range or alarm.
2. Backend creates `history.playback_session`.
3. Backend queries snapshots, asset state changes, telemetry samples, alarms.
4. Backend returns ordered timeline frames.

### Simulation prediction

Flow:

1. User creates scenario.
2. Backend writes `sim.scenario` and `sim.simulation_run`.
3. Worker computes predicted results.
4. Worker writes `sim.simulation_result`, `sim.simulation_timeseries`, `sim.simulation_diff`.
5. Client shows predicted temp/load/risk overlays.
