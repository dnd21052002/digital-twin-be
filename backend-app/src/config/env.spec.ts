import { getCorsOrigins, loadEnv } from './env';

describe('env config', () => {
  const originalEnv = process.env;
  beforeEach(() => { process.env = { ...originalEnv }; });
  afterAll(() => { process.env = originalEnv; });
  it('loads valid env values', () => {
    process.env.DATABASE_URL = 'postgresql://twin:Twin%40db@localhost:5432/twin_db';
    process.env.APP_PORT = '3000';
    const env = loadEnv();
    expect(env.DATABASE_URL).toBe('postgresql://twin:Twin%40db@localhost:5432/twin_db');
    expect(env.APP_PORT).toBe(3000);
  });
  it('throws on invalid DATABASE_URL', () => {
    process.env.DATABASE_URL = 'not-a-url';
    expect(() => loadEnv()).toThrow('Invalid environment configuration');
  });
  it('parses CORS origins', () => {
    const origins = getCorsOrigins({ NODE_ENV: 'development', APP_ENV: 'local', APP_HOST: '0.0.0.0', APP_PORT: 3000, DATABASE_URL: 'postgresql://twin:Twin%40db@localhost:5432/twin_db', LOG_LEVEL: 'debug', CORS_ORIGINS: 'http://localhost:3000, http://localhost:5173', JWT_SECRET: 'test-secret-at-least-16', JWT_ACCESS_TTL_SECONDS: 900, JWT_REFRESH_TTL_SECONDS: 2592000, API_KEY_PEPPER: 'test-pepper', ADMIN_USERNAME: 'admin', ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: 'Admin@123456', ADMIN_DISPLAY_NAME: 'Admin' });
    expect(origins).toEqual(['http://localhost:3000', 'http://localhost:5173']);
  });
});
