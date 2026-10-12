'use strict';

const env = require('../config/env');

/**
 * Dependency-free structured logger.
 *
 * - JSON lines in production (friendly for log collectors)
 * - readable single lines in development/test
 * - secrets are never logged: callers pass metadata explicitly
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

const ACTIVE_LEVEL = LEVELS[env.LOG_LEVEL] ?? LEVELS.info;

function serialiseMeta(meta) {
  if (!meta || typeof meta !== 'object') return '';
  const parts = [];
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined) continue;
    const rendered = value instanceof Error ? value.message : value;
    parts.push(`${key}=${typeof rendered === 'object' ? JSON.stringify(rendered) : rendered}`);
  }
  return parts.length > 0 ? ` ${parts.join(' ')}` : '';
}

function write(level, message, meta) {
  if (LEVELS[level] < ACTIVE_LEVEL) return;

  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...(meta && typeof meta === 'object' ? meta : {}),
  };

  const line = env.isProduction
    ? JSON.stringify(entry)
    : `${entry.time} ${level.toUpperCase().padEnd(5)} ${message}${serialiseMeta(meta)}`;

  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

module.exports = {
  debug: (message, meta) => write('debug', message, meta),
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};
