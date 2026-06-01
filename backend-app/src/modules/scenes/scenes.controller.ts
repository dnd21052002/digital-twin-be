import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { ScenesService } from './scenes.service';

class SceneIdParamDto {
  @IsUUID()
  sceneId!: string;
}

@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('scenes')
export class ScenesController {
  constructor(private readonly scenes: ScenesService) {}

  @Get()
  listScenes() {
    return this.scenes.listScenes();
  }

  @Get(':sceneId/manifest')
  getSceneManifest(@Param() params: SceneIdParamDto) {
    return this.scenes.getSceneManifest(params.sceneId);
  }
}
