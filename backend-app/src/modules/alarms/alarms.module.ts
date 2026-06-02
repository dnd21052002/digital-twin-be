import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { IamModule } from '../iam/iam.module';
import { AlarmsActionController, AlarmsCameraController, AlarmsController, AlarmsSopController } from './alarms.controller';
import { AlarmsRepository } from './alarms.repository';
import { AlarmsService } from './alarms.service';

@Module({ imports: [DbModule, IamModule], controllers: [AlarmsController, AlarmsActionController, AlarmsCameraController, AlarmsSopController], providers: [AlarmsRepository, AlarmsService] })
export class AlarmsModule {}
