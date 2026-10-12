'use strict';

const crypto = require('crypto');

const logger = require('../utils/logger');

/**
 * Attaches a request id and emits one structured access log line per request.
 * The id is echoed back as `x-request-id` so a client error report can be
 * correlated with server logs.
 */
function requestContext(req, res, next) {
  const incoming = req.get('x-request-id');
  const requestId = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID();

  req.id = requestId;
  res.locals.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const meta = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
    };
    if (res.statusCode >= 500) logger.error('request failed', meta);
    else if (res.statusCode >= 400) logger.warn('request rejected', meta);
    else logger.debug('request completed', meta);
  });

  next();
}

module.exports = requestContext;
