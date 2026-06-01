import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../iam/auth.guard';
import { RequirePermissions } from '../iam/rbac.decorator';
import { RbacGuard } from '../iam/rbac.guard';
import { FacilityService } from './facility.service';

@UseGuards(AuthGuard, RbacGuard)
@Controller('facility')
export class FacilityController {
  constructor(private readonly facility: FacilityService) {}

  @Get('tree')
  @RequirePermissions('asset:read')
  getTree() {
    return this.facility.getTree();
  }
}
