import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiErrorResponseDto, OkResponseDto } from '../../common/swagger/api-response.dto';
import { AuthGuard } from './auth.guard';
import { AuthTokenResponseDto, LoginDto, PublicUserDto, RefreshDto } from './dto/auth.dto';
import { IamService } from './iam.service';

@ApiTags('auth')
@Controller()
export class IamController {
  constructor(private readonly iam: IamService) {}

  @Post('auth/login')
  @ApiOperation({ summary: 'Login and create an access/refresh token pair.' })
  @ApiOkResponse({ type: AuthTokenResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  login(@Body() dto: LoginDto, @Req() req: Request) { return this.iam.login(dto.identifier, dto.password, req); }

  @Post('auth/refresh')
  @ApiOperation({ summary: 'Rotate refresh token and issue a new access token.' })
  @ApiOkResponse({ type: AuthTokenResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  refresh(@Body() dto: RefreshDto) { return this.iam.refresh(dto.refreshToken); }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer')
  @Post('auth/logout')
  @ApiOperation({ summary: 'Revoke the current bearer session.' })
  @ApiOkResponse({ type: OkResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  logout(@Req() req: Request) { return this.iam.logout(req.user!.sessionId); }

  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearer')
  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated user.' })
  @ApiOkResponse({ type: PublicUserDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  me(@Req() req: Request) { return this.iam.me(req.user!.id); }
}
