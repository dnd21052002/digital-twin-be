# Backend Phase 1 Auth RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement login/logout/refresh/me, JWT/session auth, RBAC guard, API-key auth foundation, and admin seed process against existing `iam` schema.

**Architecture:** Add `iam` module to existing NestJS app. Keep auth self-contained: DTOs, repository SQL, password/token crypto helpers, guards/decorators, controllers. Use DB-backed refresh sessions (`iam.session`) and stateless access JWTs.

**Tech Stack:** NestJS, TypeScript, Kysely SQL, `@nestjs/jwt`, `bcryptjs`, `crypto`, Supertest/Jest.

---

## Decisions

- Password hashes: bcryptjs hash in `iam.user.password_hash`.
- Refresh tokens: opaque random token; DB stores SHA-256 hash in `iam.session.refresh_token_hash`.
- Access tokens: JWT signed with `JWT_SECRET`, includes `sub`, `sessionId`, `roles`, `permissions`.
- Default TTLs: access 900s, refresh 2592000s.
- `/auth/logout` revokes current session from bearer JWT.
- `/auth/refresh` rotates refresh session token.
- `GET /me` requires bearer JWT.
- API-key auth foundation validates `x-api-key`, updates `last_used_at`, exposes scopes. No endpoint uses it yet.
- Admin seed process creates/updates an admin user and grants ADMIN role.

## Files

Create under `backend-app/src/modules/iam/`:

```text
dto/auth.dto.ts
iam.module.ts
iam.repository.ts
iam.service.ts
iam.controller.ts
password.service.ts
token.service.ts
rbac.decorator.ts
auth.guard.ts
rbac.guard.ts
api-key.guard.ts
iam.service.spec.ts
```

Create:

```text
backend-app/scripts/seed-admin.ts
backend-app/src/types/express.d.ts
```

Modify:

```text
backend-app/package.json
backend-app/.env.example
backend-app/src/config/env.ts
backend-app/src/app.module.ts
backend-app/src/common/errors/http-exception.filter.ts
backend-app/test/app.e2e-spec.ts
TASKS.md
API.md
ENV.md
```

## Tasks

### Task 1 — Dependencies/env

- Add deps: `@nestjs/jwt`, `bcryptjs`, `cookie-parser` not needed, `@types/bcryptjs` if package lacks types.
- Add env vars: `JWT_SECRET`, `JWT_ACCESS_TTL_SECONDS`, `JWT_REFRESH_TTL_SECONDS`, `API_KEY_PEPPER`, `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_DISPLAY_NAME`.
- Update env tests.

### Task 2 — IAM repository

Implement SQL queries:

- find active user by username/email.
- find user by id.
- update `last_login_at`.
- get user roles/permissions.
- create session.
- find active session by refresh hash.
- revoke session.
- rotate session refresh hash/expiry.
- find API key by prefix and active status.
- update API key last used.
- seed admin user and role assignment.

### Task 3 — Crypto/token services

Implement:

- bcrypt hash/verify.
- random refresh token generation.
- SHA-256 token hash.
- JWT sign/verify.
- API key SHA-256 with `API_KEY_PEPPER`.

### Task 4 — Auth service/controller

Implement endpoints:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/me`

Responses match `API.md`.

### Task 5 — Guards/decorators

Implement:

- `AuthGuard` bearer JWT.
- `RequirePermissions(...codes)` decorator.
- `RbacGuard` permission check.
- `ApiKeyGuard` for `x-api-key` foundation.
- Express request typing for `user` and `apiKey`.

### Task 6 — Seed admin script

Add npm script:

```json
"seed:admin": "ts-node scripts/seed-admin.ts"
```

Script reads admin env, creates/updates user, grants ADMIN role.

### Task 7 — Tests

- Unit tests for password/token/auth service core cases.
- E2E: seed test user in DB, login, me, refresh, logout, invalid login.
- Keep health tests passing.

### Task 8 — Docs/tasks

- Mark Phase 1 tasks checked in `TASKS.md`:
  - login/logout/refresh/me
  - RBAC middleware
  - API key auth foundation
  - admin seed process
- Keep audit login/logout unchecked unless implemented.
- Update `API.md` auth section with implemented fields if needed.
- Update `ENV.md` with new env vars.

### Task 9 — Verification

Run:

```bash
cd backend-app
npm install
npm test
npm run test:e2e
npm run build
```

Manual smoke:

```bash
npm run seed:admin
npm run start:prod
curl -X POST http://localhost:3000/api/v1/auth/login -H 'content-type: application/json' -d '{"identifier":"admin","password":"Admin@123456"}'
```

Expected: access/refresh token response.

## Self-review

Scope fits one implementation plan. No placeholders. Phase 1 audit entries can stay pending if not implemented.
