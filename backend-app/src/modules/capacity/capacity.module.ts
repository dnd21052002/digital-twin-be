import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { IamModule } from '../iam/iam.module';
import { CapacityController } from './capacity.controller';
import { CapacityRepository } from './capacity.repository';
import { CapacityService } from './capacity.service';

@Module({ imports: [DbModule, IamModule], controllers: [CapacityController], providers: [CapacityRepository, CapacityService] })
export class CapacityModule {}
