'use strict';

const cors = require('cors');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Restricted CORS.
 *
 * - only the origins listed in CLIENT_URL are allowed
 * - credentials are enabled because auth lives in an httpOnly cookie
 * - requests without an Origin header (curl, same-origin, server-to-server)
 *   are allowed through: the browser is the only client that sends Origin,
 *   and CSRF protection covers those cases separately.
 */
function originAllowed(origin) {
  return env.clientOrigins.includes(origin.replace(/\/$/, ''));
}

function corsOptions() {
  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (originAllowed(origin)) return callback(null, true);
      return callback(ApiError.forbidden('Request origin is not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', env.CSRF_HEADER_NAME, 'x-request-id'],
    exposedHeaders: ['x-request-id', 'RateLimit', 'RateLimit-Policy'],
    maxAge: 600,
  };
}

module.exports = { corsOptions, originAllowed, corsMiddleware: () => cors(corsOptions()) };
