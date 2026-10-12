'use strict';

/**
 * Parses simple duration strings ("900", "30m", "12h", "7d") into
 * milliseconds. Used to align cookie maxAge with the JWT lifetime.
 */
const UNIT_TO_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};

function parseDurationToMs(value, fallbackMs = 24 * 60 * 60 * 1000) {
  if (typeof value === 'number' && Number.isFinite(value)) return value * 1000;
  if (typeof value !== 'string') return fallbackMs;

  const match = value.trim().match(/^(\d+)([smhdw])?$/i);
  if (!match) return fallbackMs;

  const amount = Number.parseInt(match[1], 10);
  const unit = (match[2] || 's').toLowerCase();
  return amount * (UNIT_TO_MS[unit] ?? 1000);
}

module.exports = { parseDurationToMs };
