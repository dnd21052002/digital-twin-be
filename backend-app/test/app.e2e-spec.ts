process.env.DATABASE_URL ??= 'postgresql://twin:Twin%40db@localhost:5432/twin_db';
process.env.APP_PORT ??= '3000';
process.env.LOG_LEVEL ??= 'silent';
process.env.JWT_SECRET ??= 'test-secret-at-least-16';
process.env.API_KEY_PEPPER ??= 'test-pepper';

import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { sql } from 'kysely';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/errors/http-exception.filter';
import { DbService } from '../src/db/db.service';
import { PasswordService } from '../src/modules/iam/password.service';

describe('App e2e', () => {
  let app: INestApplication;
  let db: DbService;
  let password: string;
  let assetFixture: { assetId: string; rackAssetId: string; siteId: string; buildingId: string; floorId: string; hallId: string; zoneId: string; rowId: string; rackPositionId: string };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => new BadRequestException({
        code: 'validation_failed',
        message: errors.flatMap((error) => Object.values(error.constraints ?? {})),
      }),
    }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    db = app.get(DbService);
    password = 'Test@123456';
    const hash = await new PasswordService().hash(password);
    const u = await sql<{ user_id: string }>`
      INSERT INTO iam."user" (username, email, display_name, password_hash, is_active)
      VALUES ('e2e-admin', 'e2e-admin@example.com', 'E2E Admin', ${hash}, true)
      ON CONFLICT (username) DO UPDATE
      SET password_hash = EXCLUDED.password_hash, is_active = true, deleted_at = NULL
      RETURNING user_id
    `.execute(db.db);
    const r = await sql<{ role_id: string }>`
      INSERT INTO iam.role (role_code, name, is_system)
      VALUES ('ADMIN', 'Admin', true)
      ON CONFLICT (role_code) DO UPDATE SET name = EXCLUDED.name
      RETURNING role_id
    `.execute(db.db);
    await sql`
      INSERT INTO iam.user_role (user_id, role_id, granted_by)
      SELECT ${u.rows[0].user_id}, ${r.rows[0].role_id}, ${u.rows[0].user_id}
      WHERE NOT EXISTS (
        SELECT 1 FROM iam.user_role
        WHERE user_id = ${u.rows[0].user_id}
          AND role_id = ${r.rows[0].role_id}
          AND scope_site_id IS NULL
      )
    `.execute(db.db);
    const permission = await sql<{ permission_id: string }>`
      INSERT INTO iam.permission (code, resource, action, description)
      VALUES ('asset:read', 'asset', 'read', 'Read assets')
      ON CONFLICT (code) DO UPDATE SET resource = EXCLUDED.resource, action = EXCLUDED.action
      RETURNING permission_id
    `.execute(db.db);
    await sql`
      INSERT INTO iam.role_permission (role_id, permission_id)
      VALUES (${r.rows[0].role_id}, ${permission.rows[0].permission_id})
      ON CONFLICT DO NOTHING
    `.execute(db.db);
    await sql`
      SELECT setval(pg_get_serial_sequence('facility.site', 'site_id'), GREATEST((SELECT COALESCE(MAX(site_id), 1) FROM facility.site), 1), true),
             setval(pg_get_serial_sequence('facility.building', 'building_id'), GREATEST((SELECT COALESCE(MAX(building_id), 1) FROM facility.building), 1), true),
             setval(pg_get_serial_sequence('facility.floor', 'floor_id'), GREATEST((SELECT COALESCE(MAX(floor_id), 1) FROM facility.floor), 1), true),
             setval(pg_get_serial_sequence('facility.hall', 'hall_id'), GREATEST((SELECT COALESCE(MAX(hall_id), 1) FROM facility.hall), 1), true),
             setval(pg_get_serial_sequence('facility.zone', 'zone_id'), GREATEST((SELECT COALESCE(MAX(zone_id), 1) FROM facility.zone), 1), true),
             setval(pg_get_serial_sequence('facility.row', 'row_id'), GREATEST((SELECT COALESCE(MAX(row_id), 1) FROM facility.row), 1), true),
             setval(pg_get_serial_sequence('facility.rack_position', 'rack_pos_id'), GREATEST((SELECT COALESCE(MAX(rack_pos_id), 1) FROM facility.rack_position), 1), true),
             setval(pg_get_serial_sequence('asset.asset_category', 'category_id'), GREATEST((SELECT COALESCE(MAX(category_id), 1) FROM asset.asset_category), 1), true),
             setval(pg_get_serial_sequence('asset.asset_model', 'model_id'), GREATEST((SELECT COALESCE(MAX(model_id), 1) FROM asset.asset_model), 1), true)
    `.execute(db.db);

    const site = await sql<{ site_id: string }>`
      INSERT INTO facility.site (code, name, timezone)
      VALUES ('E2E-ASSET-SITE', 'E2E Asset Site', 'UTC')
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, deleted_at = NULL
      RETURNING site_id::text AS site_id
    `.execute(db.db);
    const building = await sql<{ building_id: string }>`
      INSERT INTO facility.building (site_id, code, name, floor_count)
      VALUES (${site.rows[0].site_id}, 'E2E-BLDG', 'E2E Building', 1)
      ON CONFLICT (site_id, code) DO UPDATE SET name = EXCLUDED.name, deleted_at = NULL
      RETURNING building_id::text AS building_id
    `.execute(db.db);
    const floor = await sql<{ floor_id: string }>`
      INSERT INTO facility.floor (building_id, level, code, name)
      VALUES (${building.rows[0].building_id}, 1, 'E2E-F1', 'E2E Floor 1')
      ON CONFLICT (building_id, level) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name
      RETURNING floor_id::text AS floor_id
    `.execute(db.db);
    const hall = await sql<{ hall_id: string }>`
      INSERT INTO facility.hall (floor_id, code, name, area_m2)
      VALUES (${floor.rows[0].floor_id}, 'E2E-HALL', 'E2E Hall', 100)
      ON CONFLICT (floor_id, code) DO UPDATE SET name = EXCLUDED.name
      RETURNING hall_id::text AS hall_id
    `.execute(db.db);
    const zone = await sql<{ zone_id: string }>`
      INSERT INTO facility.zone (hall_id, code, name, zone_type)
      VALUES (${hall.rows[0].hall_id}, 'E2E-ZONE', 'E2E Zone', 'utility')
      ON CONFLICT (hall_id, code) DO UPDATE SET name = EXCLUDED.name
      RETURNING zone_id::text AS zone_id
    `.execute(db.db);
    const row = await sql<{ row_id: string }>`
      INSERT INTO facility.row (hall_id, code, orientation_deg)
      VALUES (${hall.rows[0].hall_id}, 'E2E-ROW', 90)
      ON CONFLICT (hall_id, code) DO UPDATE SET orientation_deg = EXCLUDED.orientation_deg
      RETURNING row_id::text AS row_id
    `.execute(db.db);
    const rackPosition = await sql<{ rack_pos_id: string }>`
      INSERT INTO facility.rack_position (row_id, position_index, code, geom, max_u, max_power_kw)
      VALUES (${row.rows[0].row_id}, 1, 'E2E-RP1', ST_SetSRID(ST_MakePoint(1, 1, 0), 4326), 42, 12.5)
      ON CONFLICT (row_id, position_index) DO UPDATE SET code = EXCLUDED.code, geom = EXCLUDED.geom, current_rack_id = NULL
      RETURNING rack_pos_id::text AS rack_pos_id
    `.execute(db.db);
    await sql`
      INSERT INTO asset.asset_category (code, name)
      VALUES ('e2e-server', 'E2E Server')
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
    `.execute(db.db);
    const model = await sql<{ model_id: string }>`
      INSERT INTO asset.asset_model (category_code, manufacturer, model_code, display_name, default_power_kw, default_cooling_kw, rack_units, weight_kg, spec_json)
      VALUES ('e2e-server', 'E2E Maker', 'E2E-M1', 'E2E Model 1', 1.25, 1.5, 2, 20.5, '{"cpu":"test"}'::jsonb)
      ON CONFLICT (manufacturer, model_code) DO UPDATE
      SET display_name = EXCLUDED.display_name, default_power_kw = EXCLUDED.default_power_kw, default_cooling_kw = EXCLUDED.default_cooling_kw, rack_units = EXCLUDED.rack_units, weight_kg = EXCLUDED.weight_kg, spec_json = EXCLUDED.spec_json
      RETURNING model_id::text AS model_id
    `.execute(db.db);
    const asset = await sql<{ asset_id: string }>`
      INSERT INTO asset.asset (asset_id, asset_tag, display_name, category_code, model_id, serial_no, rack_pos_id, hall_id, zone_id, rotation_deg, status, attributes, deleted_at)
      VALUES ('11111111-1111-4111-8111-111111111111', 'E2E-ASSET-001', 'E2E Asset One', 'e2e-server', ${model.rows[0].model_id}, 'SN-E2E-001', ${rackPosition.rows[0].rack_pos_id}, ${hall.rows[0].hall_id}, ${zone.rows[0].zone_id}, 45, 'online', '{"owner":"qa"}'::jsonb, NULL)
      ON CONFLICT (asset_tag) DO UPDATE
      SET display_name = EXCLUDED.display_name,
          category_code = EXCLUDED.category_code,
          model_id = EXCLUDED.model_id,
          serial_no = EXCLUDED.serial_no,
          rack_pos_id = EXCLUDED.rack_pos_id,
          hall_id = EXCLUDED.hall_id,
          zone_id = EXCLUDED.zone_id,
          rotation_deg = EXCLUDED.rotation_deg,
          status = EXCLUDED.status,
          attributes = EXCLUDED.attributes,
          deleted_at = NULL
      RETURNING asset_id::text AS asset_id
    `.execute(db.db);
    const rackAsset = await sql<{ asset_id: string }>`
      INSERT INTO asset.asset (asset_id, asset_tag, display_name, category_code, rack_pos_id, hall_id, zone_id, rotation_deg, status, attributes, deleted_at)
      VALUES ('33333333-3333-4333-8333-333333333333', 'E2E-RACK-001', 'E2E Rack One', 'IT_RACK', ${rackPosition.rows[0].rack_pos_id}, ${hall.rows[0].hall_id}, ${zone.rows[0].zone_id}, 0, 'online', '{"owner":"qa"}'::jsonb, NULL)
      ON CONFLICT (asset_tag) DO UPDATE
      SET display_name = EXCLUDED.display_name,
          category_code = EXCLUDED.category_code,
          rack_pos_id = EXCLUDED.rack_pos_id,
          hall_id = EXCLUDED.hall_id,
          zone_id = EXCLUDED.zone_id,
          rotation_deg = EXCLUDED.rotation_deg,
          status = EXCLUDED.status,
          attributes = EXCLUDED.attributes,
          deleted_at = NULL
      RETURNING asset_id::text AS asset_id
    `.execute(db.db);
    await sql`
      INSERT INTO asset.rack (asset_id, total_u, used_u, power_capacity_kw, cooling_demand_kw, phase, network_uplink_gbps)
      VALUES (${rackAsset.rows[0].asset_id}, 42, 0, 12.5, 1.5, '1P', 10)
      ON CONFLICT (asset_id) DO UPDATE
      SET total_u = EXCLUDED.total_u,
          used_u = EXCLUDED.used_u,
          power_capacity_kw = EXCLUDED.power_capacity_kw,
          cooling_demand_kw = EXCLUDED.cooling_demand_kw,
          phase = EXCLUDED.phase,
          network_uplink_gbps = EXCLUDED.network_uplink_gbps
    `.execute(db.db);
    assetFixture = {
      assetId: asset.rows[0].asset_id,
      rackAssetId: rackAsset.rows[0].asset_id,
      siteId: site.rows[0].site_id,
      buildingId: building.rows[0].building_id,
      floorId: floor.rows[0].floor_id,
      hallId: hall.rows[0].hall_id,
      zoneId: zone.rows[0].zone_id,
      rowId: row.rows[0].row_id,
      rackPositionId: rackPosition.rows[0].rack_pos_id,
    };
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(): Promise<string> {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ identifier: 'e2e-admin', password }).expect(201);
    return res.body.accessToken;
  }

  it('GET /api/v1/health', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200).expect(({ body }) => {
      expect(body.status).toBe('ok');
    });
  });

  it('GET /api/v1/health/db', async () => {
    await request(app.getHttpServer()).get('/api/v1/health/db').expect(200).expect(({ body }) => {
      expect(body.status).toBe('ok');
      expect(body.database).toBe('twin_db');
    });
  });

  it('returns standardized 404 error', async () => {
    await request(app.getHttpServer()).get('/api/v1/not-found').expect(404).expect(({ body }) => {
      expect(body.error.code).toBe('not_found');
    });
  });

  it('returns validation_failed for invalid payload', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/login').send({ identifier: 'e2e-admin' }).expect(400).expect(({ body }) => {
      expect(body.error.code).toBe('validation_failed');
      expect(body.error.message).toBe('Validation failed');
    });
  });

  it('auth login me refresh logout invalid login', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/login').send({ identifier: 'e2e-admin', password: 'bad' }).expect(401);
    const loginRes = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ identifier: 'e2e-admin', password }).expect(201);
    expect(loginRes.body.accessToken).toBeTruthy();
    expect(loginRes.body.refreshToken).toBeTruthy();

    await request(app.getHttpServer()).get('/api/v1/me').set('authorization', 'Bearer invalid-token').expect(401).expect(({ body }) => {
      expect(body.error.code).toBe('unauthorized');
    });
    await request(app.getHttpServer()).get('/api/v1/me').set('authorization', `Bearer ${loginRes.body.accessToken}`).expect(200).expect(({ body }) => {
      expect(body.username).toBe('e2e-admin');
    });

    const refreshed = await request(app.getHttpServer()).post('/api/v1/auth/refresh').send({ refreshToken: loginRes.body.refreshToken }).expect(201);
    expect(refreshed.body.accessToken).toBeTruthy();
    expect(refreshed.body.refreshToken).not.toBe(loginRes.body.refreshToken);
    await request(app.getHttpServer()).post('/api/v1/auth/refresh').send({ refreshToken: loginRes.body.refreshToken }).expect(401);

    await request(app.getHttpServer()).post('/api/v1/auth/logout').set('authorization', `Bearer ${refreshed.body.accessToken}`).expect(201);
    await request(app.getHttpServer()).get('/api/v1/me').set('authorization', `Bearer ${refreshed.body.accessToken}`).expect(401);
  });

  it('GET /api/v1/facility/tree returns hierarchy shape', async () => {
    const token = await login();
    await request(app.getHttpServer())
      .get('/api/v1/facility/tree')
      .set('authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body.sites)).toBe(true);
      });
  });

  it('GET /api/v1/facility/rack-positions returns filtered rack positions', async () => {
    const token = await login();
    await request(app.getHttpServer())
      .get(`/api/v1/facility/rack-positions?siteId=${assetFixture.siteId}&limit=1`)
      .set('authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.nextCursor).toBeNull();
        expect(body.items).toHaveLength(1);
        expect(body.items[0]).toMatchObject({
          id: assetFixture.rackPositionId,
          code: 'E2E-RP1',
          positionIndex: 1,
          maxU: 42,
          maxPowerKw: 12.5,
          currentRackId: null,
          location: {
            siteId: assetFixture.siteId,
            buildingId: assetFixture.buildingId,
            floorId: assetFixture.floorId,
            hallId: assetFixture.hallId,
            zoneId: null,
            rowId: assetFixture.rowId,
          },
        });
      });
  });

  it('GET /api/v1/facility/rack-positions rejects negative limit', async () => {
    const token = await login();
    await request(app.getHttpServer())
      .get('/api/v1/facility/rack-positions?limit=-1')
      .set('authorization', `Bearer ${token}`)
      .expect(400)
      .expect(({ body }) => {
        expect(body.error.code).toBe('validation_failed');
      });
  });

  it('GET /api/v1/facility/rack-positions filters by current rack zone', async () => {
    const token = await login();
    await sql`
      UPDATE facility.rack_position
      SET current_rack_id = ${assetFixture.rackAssetId}
      WHERE rack_pos_id = ${assetFixture.rackPositionId}
    `.execute(db.db);

    await request(app.getHttpServer())
      .get(`/api/v1/facility/rack-positions?zoneId=${assetFixture.zoneId}`)
      .set('authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: assetFixture.rackPositionId,
              currentRackId: assetFixture.rackAssetId,
              location: expect.objectContaining({ zoneId: assetFixture.zoneId }),
            }),
          ]),
        );
      });
  });

  it('GET /api/v1/assets lists assets with filters and cursor shape', async () => {
    const token = await login();
    await request(app.getHttpServer())
      .get(`/api/v1/assets?q=Asset%20One&category=e2e-server&status=online&siteId=${assetFixture.siteId}&limit=1`)
      .set('authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.nextCursor).toBeNull();
        expect(body.items).toHaveLength(1);
        expect(body.items[0]).toEqual({
          id: assetFixture.assetId,
          assetTag: 'E2E-ASSET-001',
          name: 'E2E Asset One',
          category: 'e2e-server',
          status: 'online',
          location: {
            siteId: assetFixture.siteId,
            buildingId: assetFixture.buildingId,
            floorId: assetFixture.floorId,
            hallId: assetFixture.hallId,
            zoneId: assetFixture.zoneId,
            rowId: assetFixture.rowId,
            rackPositionId: assetFixture.rackPositionId,
          },
        });
      });
  });

  it('GET /api/v1/assets/:assetId returns asset detail', async () => {
    const token = await login();
    await request(app.getHttpServer())
      .get(`/api/v1/assets/${assetFixture.assetId}`)
      .set('authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          id: assetFixture.assetId,
          assetTag: 'E2E-ASSET-001',
          name: 'E2E Asset One',
          category: { code: 'e2e-server', name: 'E2E Server' },
          model: {
            manufacturer: 'E2E Maker',
            modelCode: 'E2E-M1',
            displayName: 'E2E Model 1',
            rackUnits: 2,
            spec: { cpu: 'test' },
          },
          serialNo: 'SN-E2E-001',
          status: 'online',
          location: {
            site: { id: assetFixture.siteId, name: 'E2E Asset Site' },
            building: { id: assetFixture.buildingId, name: 'E2E Building' },
            floor: { id: assetFixture.floorId, name: 'E2E Floor 1' },
            hall: { id: assetFixture.hallId, name: 'E2E Hall' },
            zone: { id: assetFixture.zoneId, name: 'E2E Zone' },
            row: { id: assetFixture.rowId, name: 'E2E-ROW' },
            rackPosition: { id: assetFixture.rackPositionId, name: 'E2E-RP1' },
          },
          attributes: { owner: 'qa' },
        });
        expect(body.geometry.rotationDeg).toBe(45);
        expect(body.model.id).toBeTruthy();
        expect(body.model.defaultPowerKw).toBe(1.25);
        expect(body.model.defaultCoolingKw).toBe(1.5);
        expect(body.model.weightKg).toBe(20.5);
      });
  });

  it('GET /api/v1/assets/:assetId returns 404 for missing asset', async () => {
    const token = await login();
    await request(app.getHttpServer())
      .get('/api/v1/assets/22222222-2222-4222-8222-222222222222')
      .set('authorization', `Bearer ${token}`)
      .expect(404)
      .expect(({ body }) => {
        expect(body.error.message).toBe('Asset not found');
      });
  });

  it('GET /api/v1/scenes returns scene list shape', async () => {
    const token = await login();
    await request(app.getHttpServer())
      .get('/api/v1/scenes')
      .set('authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body.items)).toBe(true);
      });
  });

  it('documents sceneId path parameter for scene manifest', () => {
    const document = SwaggerModule.createDocument(app, new DocumentBuilder().build());

    const operation = document.paths['/api/v1/scenes/{sceneId}/manifest']?.get;
    expect(operation).toBeDefined();
    expect(operation!.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'sceneId',
          in: 'path',
          required: true,
          schema: expect.objectContaining({ format: 'uuid' }),
        }),
      ]),
    );
  });

  it('GET /api/v1/scenes/:sceneId/manifest returns 404 for missing scene', async () => {
    const token = await login();
    await request(app.getHttpServer())
      .get('/api/v1/scenes/00000000-0000-4000-8000-000000000000/manifest')
      .set('authorization', `Bearer ${token}`)
      .expect(404)
      .expect(({ body }) => {
        expect(body.error.message).toBe('Scene not found');
      });
  });
});
