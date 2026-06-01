import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { IamModule } from '../iam/iam.module';
import { ScenesController } from './scenes.controller';
import { ScenesRepository } from './scenes.repository';
import { ScenesService } from './scenes.service';

@Module({ imports: [DbModule, IamModule], controllers: [ScenesController], providers: [ScenesRepository, ScenesService] })
export class ScenesModule {}
