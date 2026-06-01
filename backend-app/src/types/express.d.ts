import 'express';

declare global {
  namespace Express {
    interface AuthUser { id: string; sessionId: string; roles: string[]; permissions: string[]; }
    interface ApiKeyAuth { id: string; scopes: string[]; ownerUserId: string | null; }
    interface Request { user?: AuthUser; apiKey?: ApiKeyAuth; }
  }
}
