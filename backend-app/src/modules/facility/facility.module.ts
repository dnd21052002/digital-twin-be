import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { IamModule } from '../iam/iam.module';
import { FacilityController } from './facility.controller';
import { FacilityRepository } from './facility.repository';
import { FacilityService } from './facility.service';

@Module({ imports: [DbModule, IamModule], controllers: [FacilityController], providers: [FacilityRepository, FacilityService] })
export class FacilityModule {}
