'use strict';

/**
 * Runs before each test file is loaded, so src/config/env.js picks these up.
 * Values are deterministic and never point at a real database.
 */

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = process.env.VERBOSE_TESTS ? 'info' : 'silent';
process.env.JWT_SECRET = 'test_only_jwt_secret_0123456789abcdefghijklmnopqrstuvwxyz';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.COOKIE_SECURE = '0';
process.env.COOKIE_SAME_SITE = 'lax';
// Small lockout threshold keeps the bcrypt-heavy lockout test fast.
process.env.ACCOUNT_LOCK_MAX_ATTEMPTS = '3';
process.env.ACCOUNT_LOCK_MINUTES = '15';
// The limiter is exercised explicitly with overrides; keep the default high so
// unrelated tests are not throttled.
process.env.RATE_LIMIT_AUTH_MAX = '200';
process.env.RATE_LIMIT_GLOBAL_MAX = '1000';

jest.setTimeout(60000);
