import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { AssetsService } from './assets.service';
import { AssetDetailDto, AssetListResponseDto } from './dto/assets-response.dto';
import { AssetIdParamDto } from './dto/assets-query.dto';

@ApiTags('assets')
@ApiBearerAuth('bearer')

@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'List/search assets.' })
  @ApiQuery({ name: 'limit', required: false, schema: { type: 'integer', minimum: 1, maximum: 100, default: 50 } })
  @ApiQuery({ name: 'cursor', required: false, schema: { type: 'string' } })
  @ApiQuery({ name: 'q', required: false, schema: { type: 'string' }, description: 'Search by asset tag/name.' })
  @ApiQuery({ name: 'category', required: false, schema: { type: 'string', example: 'rack' } })
  @ApiQuery({ name: 'siteId', required: false, schema: { type: 'string' } })
  @ApiQuery({ name: 'status', required: false, schema: { type: 'string', example: 'online' } })
  @ApiOkResponse({ type: AssetListResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  listAssets(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('siteId') siteId?: string,
    @Query('status') status?: string,
  ) {
    return this.assets.listAssets({ limit, cursor, q, category, siteId, status });
  }

  @Get(':assetId')
  @ApiOperation({ summary: 'Get asset detail.' })
  @ApiOkResponse({ type: AssetDetailDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  getAsset(@Param() params: AssetIdParamDto) {
    return this.assets.getAsset(params.assetId);
  }
}
