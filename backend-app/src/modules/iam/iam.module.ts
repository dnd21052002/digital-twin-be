import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ApiKeyGuard } from './api-key.guard';
import { AuthGuard } from './auth.guard';
import { IamController } from './iam.controller';
import { IamRepository } from './iam.repository';
import { IamService } from './iam.service';
import { PasswordService } from './password.service';
import { RbacGuard } from './rbac.guard';
import { TokenService } from './token.service';

@Module({ imports: [JwtModule.register({})], controllers: [IamController], providers: [IamRepository, IamService, PasswordService, TokenService, AuthGuard, RbacGuard, ApiKeyGuard], exports: [IamService, AuthGuard, RbacGuard, ApiKeyGuard, PasswordService, TokenService, IamRepository] })
export class IamModule {}
