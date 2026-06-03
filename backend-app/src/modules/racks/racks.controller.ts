import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { RackDetailDto, RackIdParamDto } from './dto/racks-response.dto';
import { RacksService } from './racks.service';

@ApiTags('racks')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('racks')
export class RacksController {
  constructor(private readonly racks: RacksService) {}

  @Get(':rackId')
  @ApiOperation({ summary: 'Get rack detail.' })
  @ApiOkResponse({ type: RackDetailDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  getRack(@Param() params: RackIdParamDto) {
    return this.racks.getRack(params.rackId);
  }
}
