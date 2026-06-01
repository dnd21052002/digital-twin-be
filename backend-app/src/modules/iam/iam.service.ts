import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { loadEnv } from '../../config/env';
import { IamRepository, IamUser } from './iam.repository';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

const API_KEY_PREFIX_LENGTHS = [8, 12];

function publicUser(user: IamUser, roles: string[], permissions: string[]) {
  return {
    id: user.user_id,
    username: user.username,
    email: user.email,
    displayName: user.display_name,
    avatarInitials: user.avatar_initials,
    roles,
    permissions,
  };
}

@Injectable()
export class IamService {
  private readonly env = loadEnv();

  constructor(
    private readonly repo: IamRepository,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  async login(identifier: string, password: string, req?: Request) {
    const user = await this.repo.findActiveUserByIdentifier(identifier);
    if (!user || !(await this.passwords.verify(password, user.password_hash))) throw new UnauthorizedException('Invalid credentials');

    const roles = await this.repo.getUserRoles(user.user_id);
    const permissions = await this.repo.getUserPermissions(user.user_id);
    const refreshToken = this.tokens.generateRefreshToken();
    const expiresAt = new Date(Date.now() + this.env.JWT_REFRESH_TTL_SECONDS * 1000);
    const sessionId = await this.repo.createSession(user.user_id, this.tokens.hashToken(refreshToken), expiresAt, req?.get('user-agent'), req?.ip);

    await this.repo.updateLastLogin(user.user_id);

    const accessToken = await this.tokens.signAccessToken({ sub: user.user_id, sessionId, roles, permissions });
    return { accessToken, refreshToken, expiresIn: this.env.JWT_ACCESS_TTL_SECONDS, user: publicUser(user, roles, permissions) };
  }

  async refresh(refreshToken: string) {
    const oldHash = this.tokens.hashToken(refreshToken);
    const nextRefreshToken = this.tokens.generateRefreshToken();
    const nextHash = this.tokens.hashToken(nextRefreshToken);
    const expiresAt = new Date(Date.now() + this.env.JWT_REFRESH_TTL_SECONDS * 1000);
    const session = await this.repo.rotateSessionByRefreshHash(oldHash, nextHash, expiresAt);
    if (!session) throw new UnauthorizedException('Invalid refresh token');

    const user = await this.repo.findActiveUserById(session.user_id);
    if (!user) {
      await this.repo.revokeSession(session.session_id);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const roles = await this.repo.getUserRoles(user.user_id);
    const permissions = await this.repo.getUserPermissions(user.user_id);
    const accessToken = await this.tokens.signAccessToken({ sub: user.user_id, sessionId: session.session_id, roles, permissions });
    return { accessToken, refreshToken: nextRefreshToken, expiresIn: this.env.JWT_ACCESS_TTL_SECONDS, user: publicUser(user, roles, permissions) };
  }

  async logout(sessionId: string) {
    await this.repo.revokeSession(sessionId);
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.repo.findActiveUserById(userId);
    if (!user) throw new UnauthorizedException();

    const roles = await this.repo.getUserRoles(userId);
    const permissions = await this.repo.getUserPermissions(userId);
    return publicUser(user, roles, permissions);
  }

  async validateAccessToken(token: string) {
    let payload;
    try {
      payload = await this.tokens.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid bearer token');
    }

    const session = await this.repo.findActiveSessionById(payload.sessionId);
    if (!session || session.user_id !== payload.sub) throw new UnauthorizedException('Invalid bearer token');

    const user = await this.repo.findActiveUserById(payload.sub);
    if (!user) throw new UnauthorizedException('Invalid bearer token');

    return { id: payload.sub, sessionId: payload.sessionId, roles: payload.roles ?? [], permissions: payload.permissions ?? [] };
  }

  async validateApiKey(apiKey: string) {
    const prefixes = API_KEY_PREFIX_LENGTHS
      .filter((length) => apiKey.length >= length)
      .map((length) => apiKey.slice(0, length));
    const rows = await this.repo.findApiKeyByCandidatePrefixes([...new Set(prefixes)]);
    const hash = this.tokens.hashApiKey(apiKey);
    const row = rows.find((candidate) => candidate.key_hash === hash);

    if (!row) throw new UnauthorizedException('Invalid API key');

    await this.repo.updateApiKeyLastUsed(row.api_key_id);
    return { id: row.api_key_id, scopes: row.scope_codes, ownerUserId: row.owner_user_id };
  }
}
