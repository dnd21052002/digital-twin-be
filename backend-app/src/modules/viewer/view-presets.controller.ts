import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiErrorResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { CreateViewPresetDto } from './dto/create-view-preset.dto';
import { ViewPresetResponseDto } from './dto/view-preset-response.dto';
import { ViewerService } from './viewer.service';

@ApiTags('viewer')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('view-presets')
export class ViewPresetsController {
  constructor(private readonly viewer: ViewerService) {}

  @Post()
  @ApiOperation({ summary: 'Save user view preset.' })
  @ApiCreatedResponse({ type: ViewPresetResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  createViewPreset(@Req() req: Request, @Body() body: CreateViewPresetDto) {
    return this.viewer.createViewPreset(req.user!.id, body);
  }
}
