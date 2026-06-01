import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { IamModule } from '../iam/iam.module';
import { TelemetryController } from './telemetry.controller';
import { TelemetryRepository } from './telemetry.repository';
import { TelemetryService } from './telemetry.service';

@Module({ imports: [DbModule, IamModule], controllers: [TelemetryController], providers: [TelemetryRepository, TelemetryService] })
export class TelemetryModule {}
