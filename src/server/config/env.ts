import 'dotenv/config';
import { z } from 'zod';

const booleanFromString = z.preprocess(
  (value) => value === true || value === 'true',
  z.boolean(),
);

const optionalString = (schema: z.ZodString) => z.preprocess(
  (value) => value === '' ? undefined : value,
  schema.optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_URL: optionalString(z.string().url()),
  MONGODB_URI: optionalString(z.string().min(1)),
  MONGODB_DB_NAME: z.string().min(1).default('gbbookings'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://127.0.0.1:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  TRUST_PROXY: booleanFromString.default(false),
  JWT_ACCESS_SECRET: z.string().min(32).default('development-only-access-secret-change-me'),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  REMEMBER_ME_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  EMAIL_VERIFICATION_TTL_MINUTES: z.coerce.number().int().min(5).max(1440).default(60),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(120).default(30),
  OTP_TTL_MINUTES: z.coerce.number().int().min(2).max(30).default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().min(3).max(10).default(5),
  BREVO_API_KEY: optionalString(z.string().min(1)),
  BREVO_SENDER_EMAIL: optionalString(z.string().email()),
  BREVO_SENDER_NAME: z.string().min(1).max(100).default('GBBookings'),
  GEMINI_API_KEY: optionalString(z.string().min(1)),
  VERCEL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

if (parsed.data.NODE_ENV === 'production' && !parsed.data.MONGODB_URI) {
  throw new Error('MONGODB_URI is required when NODE_ENV=production.');
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.JWT_ACCESS_SECRET.startsWith('development-only')) {
  throw new Error('JWT_ACCESS_SECRET must be configured when NODE_ENV=production.');
}

if (Boolean(parsed.data.BREVO_API_KEY) !== Boolean(parsed.data.BREVO_SENDER_EMAIL)) {
  throw new Error('BREVO_API_KEY and BREVO_SENDER_EMAIL must be configured together.');
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export type AppEnv = typeof env;
