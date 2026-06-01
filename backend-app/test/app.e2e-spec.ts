process.env.DATABASE_URL ??= 'postgresql://twin:Twin%40db@localhost:5432/twin_db';
process.env.APP_PORT ??= '3000';
process.env.LOG_LEVEL ??= 'silent';
process.env.JWT_SECRET ??= 'test-secret-at-least-16';
process.env.API_KEY_PEPPER ??= 'test-pepper';

import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
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
  });

  afterAll(async () => {
    await app.close();
  });

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
    const login = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ identifier: 'e2e-admin', password }).expect(201);
    expect(login.body.accessToken).toBeTruthy();
    expect(login.body.refreshToken).toBeTruthy();

    await request(app.getHttpServer()).get('/api/v1/me').set('authorization', 'Bearer invalid-token').expect(401).expect(({ body }) => {
      expect(body.error.code).toBe('unauthorized');
    });
    await request(app.getHttpServer()).get('/api/v1/me').set('authorization', `Bearer ${login.body.accessToken}`).expect(200).expect(({ body }) => {
      expect(body.username).toBe('e2e-admin');
    });

    const refreshed = await request(app.getHttpServer()).post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken }).expect(201);
    expect(refreshed.body.accessToken).toBeTruthy();
    expect(refreshed.body.refreshToken).not.toBe(login.body.refreshToken);
    await request(app.getHttpServer()).post('/api/v1/auth/refresh').send({ refreshToken: login.body.refreshToken }).expect(401);

    await request(app.getHttpServer()).post('/api/v1/auth/logout').set('authorization', `Bearer ${refreshed.body.accessToken}`).expect(201);
    await request(app.getHttpServer()).get('/api/v1/me').set('authorization', `Bearer ${refreshed.body.accessToken}`).expect(401);
  });
});
