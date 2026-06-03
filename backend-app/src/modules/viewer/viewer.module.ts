import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { IamModule } from '../iam/iam.module';
import { ViewPresetsController } from './view-presets.controller';
import { ViewerController } from './viewer.controller';
import { ViewerRepository } from './viewer.repository';
import { ViewerService } from './viewer.service';

@Module({ imports: [DbModule, IamModule], controllers: [ViewerController, ViewPresetsController], providers: [ViewerRepository, ViewerService] })
export class ViewerModule {}
