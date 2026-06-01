import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { FacilityTreeResponseDto } from './dto/facility-response.dto';
import { FacilityService } from './facility.service';

@ApiTags('facility')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RbacGuard)
@Controller('facility')
export class FacilityController {
  constructor(private readonly facility: FacilityService) {}

  @Get('tree')
  @ApiBearerAuth('bearer')
  @RequirePermissions('asset:read')
  @ApiOperation({ summary: 'Get facility hierarchy tree.' })
  @ApiOkResponse({ type: FacilityTreeResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  getTree() { return this.facility.getTree(); }
}
