import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { ViewpointsQueryDto } from './dto/viewpoints-query.dto';
import { ViewpointsResponseDto } from './dto/viewpoints-response.dto';
import { ViewerService } from './viewer.service';

@ApiTags('viewer')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('viewpoints')
export class ViewerController {
  constructor(private readonly viewer: ViewerService) {}

  @Get()
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List saved viewpoints.' })
  @ApiOkResponse({ type: ViewpointsResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  listViewpoints(@Query() query: ViewpointsQueryDto) { return this.viewer.listViewpoints(query); }
}
