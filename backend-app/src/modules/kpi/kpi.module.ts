import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { IamModule } from '../iam/iam.module';
import { KpiController } from './kpi.controller';
import { KpiRepository } from './kpi.repository';
import { KpiService } from './kpi.service';

@Module({ imports: [DbModule, IamModule], controllers: [KpiController], providers: [KpiRepository, KpiService] })
export class KpiModule {}
