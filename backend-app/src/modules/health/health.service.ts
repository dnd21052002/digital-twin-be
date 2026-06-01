import { Injectable } from '@nestjs/common';
import { DbService } from '../../db/db.service';
export interface AppHealthResponse { status: 'ok'; service: 'twin-backend'; version: string; }
export interface DbHealthResponse { status: 'ok'; database: string; user: string; extensions: string[]; hypertables: number; }
@Injectable()
export class HealthService {
  constructor(private readonly dbService: DbService) {}
  getAppHealth(): AppHealthResponse { return { status: 'ok', service: 'twin-backend', version: process.env.npm_package_version ?? '0.1.0' }; }
  async getDbHealth(): Promise<DbHealthResponse> {
    const health = await this.dbService.getHealth();
    return { status: 'ok', database: health.database, user: health.user, extensions: health.requiredExtensions, hypertables: health.hypertables };
  }
}
