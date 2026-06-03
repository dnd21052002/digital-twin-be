import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { IamModule } from '../iam/iam.module';
import { RacksController } from './racks.controller';
import { RacksRepository } from './racks.repository';
import { RacksService } from './racks.service';

@Module({ imports: [DbModule, IamModule], controllers: [RacksController], providers: [RacksRepository, RacksService] })
export class RacksModule {}
