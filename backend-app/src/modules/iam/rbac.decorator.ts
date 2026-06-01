import { SetMetadata } from '@nestjs/common';
export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';
export const RequirePermissions = (...codes: string[]) => SetMetadata(REQUIRED_PERMISSIONS_KEY, codes);
