import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { IamModule } from '../iam/iam.module';
import { ViewerController } from './viewer.controller';
import { ViewerRepository } from './viewer.repository';
import { ViewerService } from './viewer.service';

@Module({ imports: [DbModule, IamModule], controllers: [ViewerController], providers: [ViewerRepository, ViewerService] })
export class ViewerModule {}
