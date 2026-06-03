import { Body, Controller, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto, OkResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { AirflowQueryDto, LayerInstancesQueryDto, PowerPathsQueryDto, ThermalQueryDto, UserLayerStateDto } from './dto/layers-query.dto';
import { AirflowResponseDto, LayerInstancesResponseDto, LayerTypesResponseDto, PowerPathsResponseDto, ThermalGridResponseDto } from './dto/layers-response.dto';
import { LayersService } from './layers.service';
import { Request } from 'express';

@ApiTags('layers')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('layers')
export class LayersController {
  constructor(private readonly layers: LayersService) {}

  @Get('types')
  @ApiOperation({ summary: 'List layer types.' })
  @ApiOkResponse({ type: LayerTypesResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  listLayerTypes() { return this.layers.listLayerTypes(); }

  @Get('instances')
  @ApiOperation({ summary: 'List layer instances, optionally filtered by sceneId and type code.' })
  @ApiOkResponse({ type: LayerInstancesResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  listLayerInstances(@Query() query: LayerInstancesQueryDto) { return this.layers.listLayerInstances(query); }

  @Get('thermal')
  @ApiOperation({ summary: 'Return thermal grid cells with latest temperature values.' })
  @ApiOkResponse({ type: ThermalGridResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  thermalGrid(@Query() query: ThermalQueryDto) { return this.layers.thermalGrid(query); }

  @Get('airflow')
  @ApiOperation({ summary: 'Return airflow vectors.' })
  @ApiOkResponse({ type: AirflowResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  airflowVectors(@Query() query: AirflowQueryDto) { return this.layers.airflowVectors(query.sceneId ?? ''); }

  @Get('power-paths')
  @ApiOperation({ summary: 'Return power paths with connection types and geometry.' })
  @ApiOkResponse({ type: PowerPathsResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  powerPaths(@Query() query: PowerPathsQueryDto) { return this.layers.powerPaths(query.sceneId ?? ''); }

  @Get('user-state')
  @ApiOperation({ summary: 'Get current user layer states.' })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  getUserLayerState(@Req() req: Request) { return this.layers.getUserLayerState(req); }
}

@ApiTags('layers')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard, RbacGuard)
@RequirePermissions('asset:read')
@Controller('users/me/layer-state')
export class UserLayerStateController {
  constructor(private readonly layers: LayersService) {}

  @Put()
  @ApiOperation({ summary: 'Persist user layer visibility and opacity.' })
  @ApiBody({ type: UserLayerStateDto })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  saveUserLayerState(@Req() req: Request, @Body() dto: UserLayerStateDto) { return this.layers.saveUserLayerState(req, dto); }
}
