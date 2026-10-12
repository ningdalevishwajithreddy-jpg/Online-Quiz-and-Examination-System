'use strict';

const env = require('../config/env');
const { parseDurationToMs } = require('./duration');

/**
 * Auth cookies.
 *
 * The access token lives in an httpOnly cookie so JavaScript (and therefore an
 * XSS payload) can never read it. SameSite + the CSRF double-submit check in
 * middleware/csrf.js protect state-changing requests.
 */

const AUTH_COOKIE_MAX_AGE_MS = parseDurationToMs(env.JWT_EXPIRES_IN);

function authCookieOptions(overrides = {}) {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
    ...overrides,
  };
}

function setAuthCookie(res, token) {
  res.cookie(env.JWT_COOKIE_NAME, token, authCookieOptions());
}

/** Clears with the same attributes, otherwise browsers keep the stale cookie. */
function clearAuthCookie(res) {
  res.clearCookie(env.JWT_COOKIE_NAME, authCookieOptions({ maxAge: undefined }));
}

/** Cookie first (browser session), bearer header second (API clients/tests). */
function extractTokenFromRequest(req) {
  const cookieToken = req.cookies?.[env.JWT_COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const header = req.get('authorization');
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();

  return null;
}

module.exports = {
  AUTH_COOKIE_MAX_AGE_MS,
  authCookieOptions,
  clearAuthCookie,
  extractTokenFromRequest,
  setAuthCookie,
};
