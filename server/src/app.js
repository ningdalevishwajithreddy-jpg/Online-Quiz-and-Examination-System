'use strict';

const cookieParser = require('cookie-parser');
const express = require('express');
const helmet = require('helmet');

const env = require('./config/env');
const { API } = require('./config/constants');
const { corsMiddleware } = require('./middleware/cors');
const { attachCsrfToken, csrfProtection } = require('./middleware/csrf');
const { createRateLimiters } = require('./middleware/rateLimit');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { sanitizeRequest } = require('./middleware/sanitize');
const requestContext = require('./middleware/requestContext');
const routes = require('./routes');

/**
 * Builds the Express application.
 *
 * Middleware order matters and is deliberate:
 *   requestId/logging -> helmet -> CORS -> body parsers -> cookie parser ->
 *   NoSQL sanitizing -> CSRF token issue -> rate limiting -> routes -> errors
 *
 * @param {{ rateLimits?: object }} [options] test hook for rate limit overrides.
 */
function createApp(options = {}) {
  const app = express();

  app.disable('x-powered-by');
  if (env.TRUST_PROXY) app.set('trust proxy', 1);

  // Shared, swappable test configuration.
  app.locals.rateLimiters = createRateLimiters(options.rateLimits);
  app.locals.startedAt = new Date();

  app.use(requestContext);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'no-referrer' },
      // The API only ever returns JSON; CSP is enforced by the client host.
      contentSecurityPolicy: false,
    }),
  );

  app.use(corsMiddleware());

  // Small body limit: no endpoint needs large payloads and it limits abuse.
  app.use(express.json({ limit: '32kb' }));
  app.use(express.urlencoded({ extended: false, limit: '32kb' }));

  app.use(cookieParser());
  app.use(sanitizeRequest());
  app.use(attachCsrfToken);

  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: `${API.NAME} v${API.VERSION}`,
      data: { health: `${API.PREFIX}/health` },
    });
  });

  // Global limiter, then CSRF for every unsafe /api request, then the routers.
  app.use(API.PREFIX, app.locals.rateLimiters.global, csrfProtection, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
