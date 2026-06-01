import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns app health', () => {
    const service = new HealthService({ getHealth: jest.fn() } as never);
    expect(service.getAppHealth()).toEqual({ status: 'ok', service: 'twin-backend', version: '0.1.0' });
  });
  it('returns db health', async () => {
    const service = new HealthService({ getHealth: jest.fn().mockResolvedValue({ database: 'twin_db', user: 'twin', requiredExtensions: ['postgis', 'postgis_topology', 'timescaledb'], requiredExtensionCount: 3, hypertables: 12 }) } as never);
    await expect(service.getDbHealth()).resolves.toEqual({ status: 'ok', database: 'twin_db', user: 'twin', extensions: ['postgis', 'postgis_topology', 'timescaledb'], hypertables: 12 });
  });
});
