process.env.DATABASE_URL ??= 'postgresql://twin:Twin%40db@localhost:5432/twin_db';
process.env.APP_PORT ??= '3000';
process.env.LOG_LEVEL ??= 'silent';

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/errors/http-exception.filter';

describe('App e2e', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  it('GET /api/v1/health', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200).expect(({ body }) => { expect(body.status).toBe('ok'); expect(body.service).toBe('twin-backend'); });
  });
  it('GET /api/v1/health/db', async () => {
    await request(app.getHttpServer()).get('/api/v1/health/db').expect(200).expect(({ body }) => { expect(body.status).toBe('ok'); expect(body.database).toBe('twin_db'); expect(body.extensions).toEqual(['postgis', 'postgis_topology', 'timescaledb']); expect(body.hypertables).toBe(12); });
  });
  it('returns standardized 404 error', async () => {
    await request(app.getHttpServer()).get('/api/v1/not-found').expect(404).expect(({ body }) => { expect(body.error.code).toBe('not_found'); });
  });
});
