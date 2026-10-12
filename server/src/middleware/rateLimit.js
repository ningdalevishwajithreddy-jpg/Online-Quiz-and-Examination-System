'use strict';

const rateLimit = require('express-rate-limit');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Rate limiters. Each limiter reports through the central error handler so a
 * throttled client receives the same JSON error envelope as everything else.
 */

function createLimiter({ limit, message, windowMs }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // Never count a request that already failed validation/permission checks twice.
    skipSuccessfulRequests: false,
    handler: (req, res, next) => next(ApiError.tooManyRequests(message)),
  });
}

/**
 * @param {object} [overrides] partial limits, used by tests to exercise the
 *   limiter without sending hundreds of requests.
 */
function createRateLimiters(overrides = {}) {
  const windowMs = (overrides.windowMinutes ?? env.RATE_LIMIT_WINDOW_MINUTES) * 60 * 1000;

  return {
    global: createLimiter({
      windowMs,
      limit: overrides.globalMax ?? env.RATE_LIMIT_GLOBAL_MAX,
      message: 'Too many requests from this address. Please slow down and try again shortly.',
    }),
    /** Credential endpoints: login, register, password change. */
    auth: createLimiter({
      windowMs,
      limit: overrides.authMax ?? env.RATE_LIMIT_AUTH_MAX,
      message: 'Too many authentication attempts. Please try again later.',
    }),
    /** Authenticated state-changing endpoints. */
    write: createLimiter({
      windowMs,
      limit: overrides.writeMax ?? env.RATE_LIMIT_WRITE_MAX,
      message: 'Too many changes in a short period. Please try again later.',
    }),
  };
}

module.exports = { createRateLimiters };
