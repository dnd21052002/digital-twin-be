import { Module } from '@nestjs/common';
import { LoggerModule } from './common/logging/logger.module';
import { DbModule } from './db/db.module';
import { HealthModule } from './modules/health/health.module';
import { IamModule } from './modules/iam/iam.module';

@Module({ imports: [LoggerModule, DbModule, HealthModule, IamModule] })
export class AppModule {}
