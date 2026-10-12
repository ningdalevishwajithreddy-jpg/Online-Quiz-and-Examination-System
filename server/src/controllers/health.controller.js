'use strict';

const env = require('../config/env');
const { API } = require('../config/constants');
const { getDatabaseState } = require('../config/db');

/**
 * GET /api/health
 *
 * 200 when the API can reach MongoDB, 503 when it cannot. The response never
 * contains credentials, connection strings or stack traces.
 */
function getHealth(req, res) {
  const database = getDatabaseState();
  const healthy = database.connected;

  const payload = {
    status: healthy ? 'ok' : 'degraded',
    api: { name: API.NAME, version: API.VERSION },
    environment: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database,
  };

  if (!healthy) {
    return res.status(503).json({
      success: false,
      message: 'The API is running but MongoDB is unreachable.',
      data: payload,
    });
  }

  return res.status(200).json({ success: true, data: payload });
}

module.exports = { getHealth };
