import { Module } from '@nestjs/common';
import { LoggerModule } from './common/logging/logger.module';
import { DbModule } from './db/db.module';
import { AssetsModule } from './modules/assets/assets.module';
import { FacilityModule } from './modules/facility/facility.module';
import { HealthModule } from './modules/health/health.module';
import { IamModule } from './modules/iam/iam.module';
import { ScenesModule } from './modules/scenes/scenes.module';

@Module({ imports: [LoggerModule, DbModule, HealthModule, IamModule, FacilityModule, AssetsModule, ScenesModule] })
export class AppModule {}
