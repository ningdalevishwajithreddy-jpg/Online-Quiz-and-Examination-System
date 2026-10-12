'use strict';

const crypto = require('crypto');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { originAllowed } = require('./cors');

/**
 * CSRF protection for cookie-based sessions (double submit cookie).
 *
 * Because the JWT travels in an httpOnly cookie, the browser attaches it to
 * any cross-site request. Two independent checks stop that:
 *
 * 1. Origin/Referer check - a browser always sends Origin on cross-site
 *    fetch/XHR, so a foreign origin is rejected outright.
 * 2. Double submit token - a random `qs_csrf` cookie (readable by JS) must
 *    match the `x-csrf-token` header. An attacker on another origin can send
 *    the cookie but cannot read it to build the header.
 *
 * The CSRF cookie is intentionally NOT httpOnly: the client must be able to
 * read it. It carries no authority on its own.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function csrfCookieOptions() {
  return {
    httpOnly: false,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
    maxAge: 12 * 60 * 60 * 1000,
  };
}

function timingSafeEqualStrings(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufferA = crypto.createHash('sha256').update(a).digest();
  const bufferB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(bufferA, bufferB);
}

/** Issues the CSRF cookie on safe requests so the client always has a token. */
function attachCsrfToken(req, res, next) {
  if (!SAFE_METHODS.has(req.method)) return next();

  const existing = req.cookies?.[env.CSRF_COOKIE_NAME];
  if (existing && /^[a-f0-9]{64}$/.test(existing)) {
    req.csrfToken = existing;
    return next();
  }

  const token = generateCsrfToken();
  res.cookie(env.CSRF_COOKIE_NAME, token, csrfCookieOptions());
  req.csrfToken = token;
  return next();
}

/** Rejects unsafe requests that fail the origin and double-submit checks. */
function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  if (origin && !originAllowed(origin)) {
    return next(ApiError.forbidden('Request blocked: untrusted origin'));
  }

  const cookieToken = req.cookies?.[env.CSRF_COOKIE_NAME];
  const headerToken = req.get(env.CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || !timingSafeEqualStrings(cookieToken, headerToken)) {
    return next(
      ApiError.forbidden('Invalid or missing CSRF token. Refresh the page and try again.'),
    );
  }

  return next();
}

module.exports = {
  attachCsrfToken,
  csrfCookieOptions,
  csrfProtection,
  generateCsrfToken,
  timingSafeEqualStrings,
};
