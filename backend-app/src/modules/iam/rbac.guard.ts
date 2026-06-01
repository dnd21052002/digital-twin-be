import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { REQUIRED_PERMISSIONS_KEY } from './rbac.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]) ?? [];
    if (required.length === 0) return true;
    const req = context.switchToHttp().getRequest<Request>();
    const have = new Set(req.user?.permissions ?? []);
    const missing = required.find(code => !have.has(code));
    if (missing) throw new ForbiddenException(`Missing permission: ${missing}`);
    return true;
  }
}
