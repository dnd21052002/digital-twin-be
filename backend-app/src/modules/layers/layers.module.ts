import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { IamModule } from '../iam/iam.module';
import { LayersController, UserLayerStateController } from './layers.controller';
import { LayersRepository } from './layers.repository';
import { LayersService } from './layers.service';

@Module({
  imports: [DbModule, IamModule],
  controllers: [LayersController, UserLayerStateController],
  providers: [LayersRepository, LayersService],
})
export class LayersModule {}
