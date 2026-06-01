import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['local', 'test', 'staging', 'production']).default('local'),
  APP_HOST: z.string().min(1).default('0.0.0.0'),
  APP_PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),
  JWT_SECRET: z.string().min(16).default('change-me-local-secret'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive().default(2592000),
  API_KEY_PEPPER: z.string().min(8).default('change-me-local-api-key-pepper'),
  ADMIN_USERNAME: z.string().min(1).default('admin'),
  ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  ADMIN_PASSWORD: z.string().min(8).default('Admin@123456'),
  ADMIN_DISPLAY_NAME: z.string().min(1).default('Admin'),
});

export type Env = z.infer<typeof envSchema>;

const DEFAULT_JWT_SECRET = 'change-me-local-secret';
const DEFAULT_API_KEY_PEPPER = 'change-me-local-api-key-pepper';

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  assertProductionSecrets(parsed.data);
  return parsed.data;
}

export function getCorsOrigins(env: Env): string[] {
  return env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
}

function assertProductionSecrets(env: Env): void {
  const isProduction = env.NODE_ENV === 'production' || env.APP_ENV === 'production';
  if (!isProduction) return;

  const invalidSecrets: string[] = [];
  if (env.JWT_SECRET === DEFAULT_JWT_SECRET) invalidSecrets.push('JWT_SECRET');
  if (env.API_KEY_PEPPER === DEFAULT_API_KEY_PEPPER) invalidSecrets.push('API_KEY_PEPPER');

  if (invalidSecrets.length > 0) {
    throw new Error(`Invalid production environment configuration: replace default ${invalidSecrets.join(', ')}`);
  }
}
