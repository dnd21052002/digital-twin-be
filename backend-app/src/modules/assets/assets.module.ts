import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { IamModule } from '../iam/iam.module';
import { AssetsController } from './assets.controller';
import { AssetsRepository } from './assets.repository';
import { AssetsService } from './assets.service';

@Module({ imports: [DbModule, IamModule], controllers: [AssetsController], providers: [AssetsRepository, AssetsService] })
export class AssetsModule {}
