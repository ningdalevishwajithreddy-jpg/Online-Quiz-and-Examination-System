'use strict';

const path = require('path');
const fs = require('fs');

const dotenv = require('dotenv');
const { z } = require('zod');

/**
 * Environment loading + validation.
 *
 * Files are loaded from the first location that exists, in this order:
 *   1. process.env.ENV_FILE (absolute or relative path)
 *   2. <cwd>/.env              (e.g. server/.env when run via npm in server/)
 *   3. server/.env
 *   4. <repo root>/.env
 *
 * The schema fails fast with a readable message instead of letting the app
 * boot with a missing JWT secret or an invalid database URL.
 */

/**
 * Hosts and CI systems often export variables that are empty or meaningless for
 * this app (an empty PORT, or the ephemeral PORT=0 some sandboxes inject).
 * Dropping them here means the documented defaults apply instead of a confusing
 * "expected number to be >= 1" failure on boot.
 */
function normaliseHostEnvironment() {
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string' && value.trim() === '') delete process.env[key];
  }

  const rawPort = process.env.PORT?.trim();
  if (rawPort !== undefined) {
    const parsed = Number(rawPort);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
      // eslint-disable-next-line no-console -- runs before the logger exists
      console.warn(`[env] ignoring unusable PORT="${rawPort}" (expected 1-65535); using the default port`);
      delete process.env.PORT;
    }
  }
}

normaliseHostEnvironment();

const candidateEnvFiles = [
  process.env.ENV_FILE,
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
].filter(Boolean);

for (const file of candidateEnvFiles) {
  if (fs.existsSync(file)) {
    dotenv.config({ path: file, quiet: true });
    break;
  }
}

const DEV_JWT_SECRET_FALLBACK = 'dev_only_insecure_secret_change_me_0123456789abcdef';

const truthy = new Set(['1', 'true', 'yes', 'on']);
const falsy = new Set(['0', 'false', 'no', 'off', '']);

/** Booleans are parsed explicitly: z.coerce.boolean() turns "false" into true. */
const booleanFromEnv = (defaultValue) =>
  z
    .union([z.boolean(), z.string()])
    .default(defaultValue)
    .transform((value) => {
      if (typeof value === 'boolean') return value;
      const normalised = value.trim().toLowerCase();
      if (truthy.has(normalised)) return true;
      if (falsy.has(normalised)) return false;
      throw new Error(`expected a boolean-ish value, received "${value}"`);
    });

const int = (defaultValue, min, max) =>
  z.coerce.number().int().min(min).max(max).default(defaultValue);

const isHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: int(5000, 1, 65535),
  MONGO_URI: z
    .string()
    .trim()
    .min(1, 'MONGO_URI is required')
    .refine(
      (value) => value.startsWith('mongodb://') || value.startsWith('mongodb+srv://'),
      'MONGO_URI must start with mongodb:// or mongodb+srv://',
    ),
  CLIENT_URL: z
    .string()
    .trim()
    .min(1)
    .default('http://localhost:5173')
    .refine(
      (value) => value.split(',').every((origin) => isHttpUrl(origin.trim())),
      'CLIENT_URL must be a comma separated list of http(s) origins',
    ),
  TRUST_PROXY: booleanFromEnv(false),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long').default(DEV_JWT_SECRET_FALLBACK),
  JWT_EXPIRES_IN: z
    .string()
    .trim()
    .regex(/^\d+[smhdw]?$/, 'JWT_EXPIRES_IN must look like 900, 30m, 12h or 7d')
    .default('1d'),
  JWT_COOKIE_NAME: z.string().trim().min(1).default('qs_token'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_SECURE: booleanFromEnv(false),
  CSRF_COOKIE_NAME: z.string().trim().min(1).default('qs_csrf'),
  CSRF_HEADER_NAME: z.string().trim().min(1).default('x-csrf-token'),

  ACCOUNT_LOCK_MAX_ATTEMPTS: int(5, 1, 100),
  ACCOUNT_LOCK_MINUTES: int(15, 1, 1440),

  RATE_LIMIT_WINDOW_MINUTES: int(15, 1, 1440),
  RATE_LIMIT_GLOBAL_MAX: int(600, 1, 100000),
  RATE_LIMIT_AUTH_MAX: int(20, 1, 10000),
  RATE_LIMIT_WRITE_MAX: int(120, 1, 100000),

  MONGO_MAX_POOL_SIZE: int(10, 1, 200),
  MONGO_SERVER_SELECTION_TIMEOUT_MS: int(5000, 250, 60000),

  EMAIL_HOST: z.string().trim().optional(),
  EMAIL_PORT: int(587, 1, 65535).optional(),
  EMAIL_USER: z.string().trim().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().trim().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  console.error(`[env] Invalid environment configuration:\n${details}`);
  process.exit(1);
}

const raw = parsed.data;
const isProduction = raw.NODE_ENV === 'production';

const productionProblems = [];
if (isProduction) {
  if (raw.JWT_SECRET === DEV_JWT_SECRET_FALLBACK) {
    productionProblems.push('JWT_SECRET must be set to a unique value in production (the development fallback is not allowed).');
  }
  if (!raw.COOKIE_SECURE) {
    productionProblems.push('COOKIE_SECURE must be enabled in production so auth cookies are only sent over HTTPS.');
  }
  if (raw.CLIENT_URL.split(',').some((origin) => !origin.trim().startsWith('https://'))) {
    productionProblems.push('CLIENT_URL must use https:// in production.');
  }
}

if (productionProblems.length > 0) {
  console.error(`[env] Refusing to start in production:\n${productionProblems.map((p) => `  - ${p}`).join('\n')}`);
  process.exit(1);
}

/** Comma separated CLIENT_URL entries -> trimmed origins array. */
const clientOrigins = Object.freeze(
  raw.CLIENT_URL.split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean),
);

const emailEnabled = Boolean(
  raw.EMAIL_HOST && raw.EMAIL_PORT && raw.EMAIL_FROM && raw.EMAIL_USER && raw.EMAIL_PASSWORD,
);

const env = Object.freeze({
  ...raw,
  isProduction,
  isTest: raw.NODE_ENV === 'test',
  isDevelopment: raw.NODE_ENV === 'development',
  clientOrigins,
  /** Email is only ever reported as sent when a provider is actually configured. */
  emailEnabled,
  /** Cookies are cross-site safe only when SameSite=None + Secure are both set. */
  cookiesCrossSite: raw.COOKIE_SAME_SITE === 'none' && raw.COOKIE_SECURE,
});

module.exports = env;
