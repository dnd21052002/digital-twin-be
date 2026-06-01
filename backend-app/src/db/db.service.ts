import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { loadEnv } from '../config/env';

type Database = Record<string, never>;

export interface DatabaseHealth {
  database: string;
  user: string;
  requiredExtensions: string[];
  requiredExtensionCount: number;
  hypertables: number;
}

@Injectable()
export class DbService implements OnModuleDestroy {
  private readonly pool: Pool;
  readonly db: Kysely<Database>;

  constructor() {
    const env = loadEnv();
    this.pool = new Pool({ connectionString: env.DATABASE_URL });
    this.db = new Kysely<Database>({ dialect: new PostgresDialect({ pool: this.pool }) });
  }

  async ping(): Promise<{ ok: true }> {
    await sql`SELECT 1`.execute(this.db);
    return { ok: true };
  }

  async getHealth(): Promise<DatabaseHealth> {
    const identity = await sql<{ current_database: string; current_user: string }>`
      SELECT current_database(), current_user
    `.execute(this.db);

    const extensions = await sql<{ extname: string }>`
      SELECT extname
      FROM pg_extension
      WHERE extname IN ('postgis', 'postgis_topology', 'timescaledb')
      ORDER BY extname
    `.execute(this.db);

    const hypertables = await this.getHypertableCount();

    return {
      database: identity.rows[0]?.current_database ?? '',
      user: identity.rows[0]?.current_user ?? '',
      requiredExtensions: extensions.rows.map((row) => row.extname),
      requiredExtensionCount: extensions.rows.length,
      hypertables,
    };
  }

  private async getHypertableCount(): Promise<number> {
    const viewExists = await sql<{ exists: boolean }>`
      SELECT to_regclass('timescaledb_information.hypertables') IS NOT NULL AS exists
    `.execute(this.db);

    if (!viewExists.rows[0]?.exists) {
      return 0;
    }

    const hypertables = await sql<{ count: string }>`
      SELECT COUNT(*)::text AS count
      FROM timescaledb_information.hypertables
    `.execute(this.db);

    return Number(hypertables.rows[0]?.count ?? 0);
  }

  async onModuleDestroy(): Promise<void> {
    await this.db.destroy();
  }
}
