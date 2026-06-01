import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { AssetsService } from './assets.service';
import { AssetIdParamDto, AssetsQueryDto } from './dto/assets-query.dto';

@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  listAssets(@Query() query: AssetsQueryDto) {
    return this.assets.listAssets(query);
  }

  @Get(':assetId')
  getAsset(@Param() params: AssetIdParamDto) {
    return this.assets.getAsset(params.assetId);
  }
}
