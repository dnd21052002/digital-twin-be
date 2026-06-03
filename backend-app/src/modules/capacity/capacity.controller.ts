import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiErrorResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { CapacitySummaryQueryDto } from './dto/capacity-query.dto';
import { PlacementRecommendationRequestDto } from './dto/capacity-request.dto';
import { CapacitySummaryResponseDto, PlacementRecommendationResponseDto } from './dto/capacity-response.dto';
import { CapacityService } from './capacity.service';

@ApiTags('capacity')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('capacity')
export class CapacityController {
  constructor(private readonly capacity: CapacityService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Return power, cooling, space capacity by site/floor/hall/zone.' })
  @ApiOkResponse({ type: CapacitySummaryResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  summary(@Query() query: CapacitySummaryQueryDto) { return this.capacity.summary(query); }

  @Post('placement-recommendations')
  @ApiOperation({ summary: 'Create placement recommendation for new rack/device.' })
  @ApiCreatedResponse({ type: PlacementRecommendationResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  placementRecommendation(@Req() req: Request, @Body() body: PlacementRecommendationRequestDto) {
    return this.capacity.placementRecommendation(req.user!.id, body);
  }
}
