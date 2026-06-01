import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { IamService } from './iam.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly iam: IamService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const key = req.get('x-api-key');
    if (!key) throw new UnauthorizedException('Missing API key');
    req.apiKey = await this.iam.validateApiKey(key);
    return true;
  }
}
