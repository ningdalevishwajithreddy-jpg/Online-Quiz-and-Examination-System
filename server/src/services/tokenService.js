'use strict';

const jwt = require('jsonwebtoken');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Access tokens are short-lived, signed with HS256 and carry a credential
 * version (`pwdv`) so changing a password immediately invalidates every token
 * that was issued before the change.
 */

const ISSUER = 'quizsphere-api';
const AUDIENCE = 'quizsphere-client';
const ALGORITHM = 'HS256';

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      pwdv: user.credentialVersion(),
    },
    env.JWT_SECRET,
    {
      algorithm: ALGORITHM,
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: ISSUER,
      audience: AUDIENCE,
    },
  );
}

/** Throws jsonwebtoken errors, which the error handler maps to 401. */
function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    algorithms: [ALGORITHM],
    issuer: ISSUER,
    audience: AUDIENCE,
    clockTolerance: 5,
  });
}

/** Decodes without verifying - used for logging/diagnostics only. */
function decodeAccessToken(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

function assertCredentialsPresent(user) {
  if (!user) throw ApiError.unauthorized('Authentication required');
  return user;
}

module.exports = {
  AUDIENCE,
  ISSUER,
  decodeAccessToken,
  assertCredentialsPresent,
  signAccessToken,
  verifyAccessToken,
};
