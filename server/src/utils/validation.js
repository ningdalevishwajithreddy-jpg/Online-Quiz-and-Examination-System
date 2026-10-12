'use strict';

/**
 * Small, dependency-free validation helpers reused by the Zod schemas.
 * Keeping them local means the server validates the same way regardless of
 * which zod minor version is installed.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

/** Reasonably strict email check (length capped at 254 per RFC 5321). */
const isEmail = (value) =>
  typeof value === 'string' && value.length <= 254 && EMAIL_PATTERN.test(value.trim());

/** http(s) URL check used for CLIENT_URL / redirect targets. */
const isHttpUrl = (value) => {
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/** 24 character hex MongoDB ObjectId. */
const isObjectId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

/**
 * Only allow same-site relative paths as post-login redirect targets so an
 * attacker cannot turn the login form into an open redirect.
 */
const isSafeRedirectPath = (value) =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\');

module.exports = {
  EMAIL_PATTERN,
  isEmail,
  isHttpUrl,
  isObjectId,
  isSafeRedirectPath,
};
