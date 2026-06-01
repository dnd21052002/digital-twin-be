process.env.DATABASE_URL ??= 'postgresql://twin:Twin%40db@localhost:5432/twin_db';
process.env.JWT_SECRET ??= 'test-secret-at-least-16';
process.env.API_KEY_PEPPER ??= 'test-pepper';

import { JwtService } from '@nestjs/jwt';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

describe('IAM crypto services', () => {
  it('hashes and verifies passwords', async () => {
    const service = new PasswordService();
    const hash = await service.hash('Secret@123');
    expect(hash).not.toBe('Secret@123');
    expect(await service.verify('Secret@123', hash)).toBe(true);
    expect(await service.verify('wrong', hash)).toBe(false);
  });
  it('signs JWT and hashes tokens deterministically', async () => {
    const service = new TokenService(new JwtService());
    const jwt = await service.signAccessToken({ sub: 'u', sessionId: 's', roles: ['ADMIN'], permissions: ['x'] });
    await expect(service.verifyAccessToken(jwt)).resolves.toMatchObject({ sub: 'u', sessionId: 's' });
    expect(service.hashToken('abc')).toBe(service.hashToken('abc'));
    expect(service.generateRefreshToken()).not.toBe(service.generateRefreshToken());
  });
});
