import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { DbService } from '../../db/db.service';

export interface IamUser {
  user_id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_initials: string | null;
  password_hash: string;
  is_active: boolean;
}

export interface RoleRow { role_code: string; name: string; }
export interface PermissionRow { code: string; }
export interface SessionRow { session_id: string; user_id: string; expires_at: Date; revoked_at: Date | null; }
export interface ApiKeyRow { api_key_id: string; key_hash: string; scope_codes: string[]; owner_user_id: string | null; }

@Injectable()
export class IamRepository {
  constructor(private readonly dbService: DbService) {}
  private get db() { return this.dbService.db; }

  async findActiveUserByIdentifier(identifier: string): Promise<IamUser | null> {
    const r = await sql<IamUser>`
      SELECT *
      FROM iam."user"
      WHERE deleted_at IS NULL
        AND is_active = true
        AND (username = ${identifier} OR email = ${identifier})
      LIMIT 1
    `.execute(this.db);
    return r.rows[0] ?? null;
  }

  async findUserById(id: string): Promise<IamUser | null> {
    const r = await sql<IamUser>`
      SELECT *
      FROM iam."user"
      WHERE user_id = ${id}
        AND deleted_at IS NULL
      LIMIT 1
    `.execute(this.db);
    return r.rows[0] ?? null;
  }

  async findActiveUserById(id: string): Promise<IamUser | null> {
    const r = await sql<IamUser>`
      SELECT *
      FROM iam."user"
      WHERE user_id = ${id}
        AND deleted_at IS NULL
        AND is_active = true
      LIMIT 1
    `.execute(this.db);
    return r.rows[0] ?? null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await sql`UPDATE iam."user" SET last_login_at = now() WHERE user_id = ${userId}`.execute(this.db);
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const r = await sql<RoleRow>`
      SELECT DISTINCT r.role_code, r.name
      FROM iam.user_role ur
      JOIN iam.role r ON r.role_id = ur.role_id
      WHERE ur.user_id = ${userId}
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
      ORDER BY r.role_code
    `.execute(this.db);
    return r.rows.map((x) => x.role_code);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const r = await sql<PermissionRow>`
      SELECT DISTINCT p.code
      FROM iam.user_role ur
      JOIN iam.role_permission rp ON rp.role_id = ur.role_id
      JOIN iam.permission p ON p.permission_id = rp.permission_id
      WHERE ur.user_id = ${userId}
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
      ORDER BY p.code
    `.execute(this.db);
    return r.rows.map((x) => x.code);
  }

  async createSession(userId: string, refreshTokenHash: string, expiresAt: Date, userAgent?: string, ip?: string): Promise<string> {
    const r = await sql<{ session_id: string }>`
      INSERT INTO iam.session (user_id, refresh_token_hash, expires_at, user_agent, ip_inet)
      VALUES (${userId}, ${refreshTokenHash}, ${expiresAt}, ${userAgent ?? null}, ${ip ?? null})
      RETURNING session_id
    `.execute(this.db);
    return r.rows[0].session_id;
  }

  async findActiveSessionById(sessionId: string): Promise<SessionRow | null> {
    const r = await sql<SessionRow>`
      SELECT *
      FROM iam.session
      WHERE session_id = ${sessionId}
        AND revoked_at IS NULL
        AND expires_at > now()
      LIMIT 1
    `.execute(this.db);
    return r.rows[0] ?? null;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await sql`
      UPDATE iam.session
      SET revoked_at = COALESCE(revoked_at, now())
      WHERE session_id = ${sessionId}
    `.execute(this.db);
  }

  async rotateSessionByRefreshHash(oldHash: string, nextHash: string, expiresAt: Date): Promise<SessionRow | null> {
    const r = await sql<SessionRow>`
      UPDATE iam.session
      SET refresh_token_hash = ${nextHash},
          expires_at = ${expiresAt},
          last_seen_at = now()
      WHERE refresh_token_hash = ${oldHash}
        AND revoked_at IS NULL
        AND expires_at > now()
      RETURNING session_id, user_id, expires_at, revoked_at
    `.execute(this.db);
    return r.rows[0] ?? null;
  }

  async findApiKeyByPrefix(prefix: string): Promise<ApiKeyRow | null> {
    const r = await sql<ApiKeyRow>`
      SELECT *
      FROM iam.api_key
      WHERE key_prefix = ${prefix}
        AND is_active = true
        AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > now())
      LIMIT 1
    `.execute(this.db);
    return r.rows[0] ?? null;
  }

  async findApiKeyByCandidatePrefixes(prefixes: string[]): Promise<ApiKeyRow[]> {
    if (prefixes.length === 0) return [];
    const r = await sql<ApiKeyRow>`
      SELECT *
      FROM iam.api_key
      WHERE key_prefix = ANY(${prefixes})
        AND is_active = true
        AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > now())
    `.execute(this.db);
    return r.rows;
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    await sql`UPDATE iam.api_key SET last_used_at = now() WHERE api_key_id = ${id}`.execute(this.db);
  }

  async seedAdmin(input: { username: string; email: string; displayName: string; passwordHash: string }): Promise<string> {
    const u = await sql<{ user_id: string }>`
      INSERT INTO iam."user" (username, email, display_name, password_hash, is_active)
      VALUES (${input.username}, ${input.email}, ${input.displayName}, ${input.passwordHash}, true)
      ON CONFLICT (username) DO UPDATE
      SET email = EXCLUDED.email,
          display_name = EXCLUDED.display_name,
          password_hash = EXCLUDED.password_hash,
          is_active = true,
          deleted_at = NULL
      RETURNING user_id
    `.execute(this.db);
    const userId = u.rows[0].user_id;

    const role = await sql<{ role_id: string }>`
      INSERT INTO iam.role (role_code, name, description, is_system)
      VALUES ('ADMIN', 'Admin', 'System administrator', true)
      ON CONFLICT (role_code) DO UPDATE SET name = EXCLUDED.name
      RETURNING role_id
    `.execute(this.db);
    const roleId = role.rows[0].role_id;

    await sql`
      INSERT INTO iam.user_role (user_id, role_id, granted_by)
      SELECT ${userId}, ${roleId}, ${userId}
      WHERE NOT EXISTS (
        SELECT 1
        FROM iam.user_role
        WHERE user_id = ${userId}
          AND role_id = ${roleId}
          AND scope_site_id IS NULL
      )
    `.execute(this.db);

    return userId;
  }
}
