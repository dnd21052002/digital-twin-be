import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'crypto';
import { loadEnv } from '../../config/env';

export interface AccessTokenPayload { sub: string; sessionId: string; roles: string[]; permissions: string[]; }

@Injectable()
export class TokenService {
  private readonly env = loadEnv();
  constructor(private readonly jwt: JwtService) {}
  generateRefreshToken(): string { return randomBytes(48).toString('base64url'); }
  hashToken(token: string): string { return createHash('sha256').update(token).digest('hex'); }
  hashApiKey(apiKey: string): string { return createHash('sha256').update(`${this.env.API_KEY_PEPPER}:${apiKey}`).digest('hex'); }
  signAccessToken(payload: AccessTokenPayload): Promise<string> { return this.jwt.signAsync(payload, { secret: this.env.JWT_SECRET, expiresIn: this.env.JWT_ACCESS_TTL_SECONDS }); }
  verifyAccessToken(token: string): Promise<AccessTokenPayload> { return this.jwt.verifyAsync(token, { secret: this.env.JWT_SECRET }); }
}
