import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { loadEnv } from '../src/config/env';
import { PasswordService } from '../src/modules/iam/password.service';

async function main() {
  const env = loadEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });
  try {
    const passwordHash = await new PasswordService().hash(env.ADMIN_PASSWORD);
    const user = await sql<{ user_id: string }>`INSERT INTO iam."user" (username, email, display_name, password_hash, is_active) VALUES (${env.ADMIN_USERNAME}, ${env.ADMIN_EMAIL}, ${env.ADMIN_DISPLAY_NAME}, ${passwordHash}, true) ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email, display_name = EXCLUDED.display_name, password_hash = EXCLUDED.password_hash, is_active = true, deleted_at = NULL RETURNING user_id`.execute(db);
    const role = await sql<{ role_id: string }>`INSERT INTO iam.role (role_code, name, description, is_system) VALUES ('ADMIN','Admin','System administrator', true) ON CONFLICT (role_code) DO UPDATE SET name = EXCLUDED.name RETURNING role_id`.execute(db);
    await sql`INSERT INTO iam.user_role (user_id, role_id, granted_by) VALUES (${user.rows[0].user_id}, ${role.rows[0].role_id}, ${user.rows[0].user_id}) ON CONFLICT (user_id, role_id, scope_site_id) DO NOTHING`.execute(db);
    console.log(`Seeded admin user ${env.ADMIN_USERNAME} (${user.rows[0].user_id})`);
  } finally { await db.destroy(); }
}
main().catch((err) => { console.error(err); process.exit(1); });
