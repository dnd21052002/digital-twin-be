import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { LoginDto, RefreshDto } from './dto/auth.dto';
import { IamService } from './iam.service';

@Controller()
export class IamController {
  constructor(private readonly iam: IamService) {}
  @Post('auth/login') login(@Body() dto: LoginDto, @Req() req: Request) { return this.iam.login(dto.identifier, dto.password, req); }
  @Post('auth/refresh') refresh(@Body() dto: RefreshDto) { return this.iam.refresh(dto.refreshToken); }
  @UseGuards(AuthGuard) @Post('auth/logout') logout(@Req() req: Request) { return this.iam.logout(req.user!.sessionId); }
  @UseGuards(AuthGuard) @Get('me') me(@Req() req: Request) { return this.iam.me(req.user!.id); }
}
