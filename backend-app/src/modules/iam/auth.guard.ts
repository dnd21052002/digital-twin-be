import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { IamService } from './iam.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly iam: IamService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.get('authorization');
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Missing bearer token');
    req.user = await this.iam.validateAccessToken(header.slice(7));
    return true;
  }
}
