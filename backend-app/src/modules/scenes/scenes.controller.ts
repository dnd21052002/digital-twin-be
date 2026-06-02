import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { ApiErrorResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { SceneAssetsResponseDto, SceneManifestDto, ScenesResponseDto } from './dto/scenes-response.dto';
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

  @Get(':sceneId/assets')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List assets in a scene.' })
  @ApiQuery({ name: 'bbox', required: false, schema: { type: 'string', example: '0,0,0,10,10,10' } })
  @ApiQuery({ name: 'lod', required: false, schema: { oneOf: [{ type: 'integer' }, { type: 'string' }] } })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', minimum: 1, maximum: 1000, default: 500 } })
  @ApiQuery({ name: 'cursor', required: false, schema: { type: 'string' } })
  @ApiOkResponse({ type: SceneAssetsResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  listSceneAssets(
    @Param() params: SceneIdParamDto,
    @Query('bbox') bbox?: string,
    @Query('lod') lod?: string,
    @Query('limit', new DefaultValuePipe(500), ParseIntPipe) limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.scenes.listSceneAssets(params.sceneId, { bbox, lod, limit, cursor });
  }

  @Get(':sceneId/manifest')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get scene manifest.' })
  @ApiOkResponse({ type: SceneManifestDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  getSceneManifest(@Param() params: SceneIdParamDto) { return this.scenes.getSceneManifest(params.sceneId); }
}
