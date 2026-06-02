import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { FacilityTreeResponseDto } from './dto/facility-response.dto';
import { RackPositionsQueryDto } from './dto/rack-positions-query.dto';
import { RackPositionsResponseDto } from './dto/rack-positions-response.dto';
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

  @Get('rack-positions')
  @ApiBearerAuth('bearer')
  @RequirePermissions('asset:read')
  @ApiOperation({ summary: 'List rack positions.' })
  @ApiQuery({ name: 'siteId', required: false })
  @ApiQuery({ name: 'buildingId', required: false })
  @ApiQuery({ name: 'floorId', required: false })
  @ApiQuery({ name: 'hallId', required: false })
  @ApiQuery({ name: 'zoneId', required: false })
  @ApiQuery({ name: 'rowId', required: false })
  @ApiQuery({ name: 'limit', required: false, schema: { default: 50, maximum: 100 } })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiOkResponse({ type: RackPositionsResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  getRackPositions(
    @Query() query: RackPositionsQueryDto,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.facility.getRackPositions({ ...query, limit });
  }
}
