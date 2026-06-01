import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { ApiErrorResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { SceneManifestDto, ScenesResponseDto } from './dto/scenes-response.dto';
import { ScenesService } from './scenes.service';

class SceneIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sceneId!: string;
}

@ApiTags('scenes')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('scenes')
export class ScenesController {
  constructor(private readonly scenes: ScenesService) {}

  @Get()
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List available scenes.' })
  @ApiOkResponse({ type: ScenesResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  listScenes() { return this.scenes.listScenes(); }

  @Get(':sceneId/manifest')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get scene manifest.' })
  @ApiOkResponse({ type: SceneManifestDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  getSceneManifest(@Param() params: SceneIdParamDto) { return this.scenes.getSceneManifest(params.sceneId); }
}
