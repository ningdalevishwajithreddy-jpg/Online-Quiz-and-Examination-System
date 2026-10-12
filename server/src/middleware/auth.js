'use strict';

const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLE_VALUES, USER_STATUS } = require('../config/constants');
const { extractTokenFromRequest } = require('../utils/authCookies');
const { verifyAccessToken } = require('../services/tokenService');
const { getDatabaseState } = require('../config/db');

/**
 * Authentication + authorization.
 *
 * Identity is always re-read from the database: an unverified token or a token
 * belonging to a suspended account can never be trusted, and a role change
 * takes effect on the next request.
 */

const authenticate = asyncHandler(async (req, res, next) => {
  if (!getDatabaseState().connected) {
    throw ApiError.serviceUnavailable('The database is unreachable. Please try again in a moment.');
  }

  const token = extractTokenFromRequest(req);
  if (!token) {
    throw ApiError.unauthorized('Authentication required');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('Your session is no longer valid. Please sign in again.');
  }

  if (user.status !== USER_STATUS.ACTIVE) {
    throw ApiError.forbidden('This account is not available. Please contact an administrator.');
  }

  // Password change (or admin reset) invalidates previously issued tokens.
  if (Number(payload.pwdv || 0) !== user.credentialVersion()) {
    throw ApiError.unauthorized('Your credentials changed. Please sign in again.');
  }

  req.user = user;
  req.auth = { token, payload };
  return next();
});

/** Role gate. Usage: requireRole(ROLES.ADMIN, ROLES.TEACHER) */
function requireRole(...allowedRoles) {
  const allowed = allowedRoles.flat().filter(Boolean);
  if (allowed.length === 0 || !allowed.every((role) => ROLE_VALUES.includes(role))) {
    throw new Error('requireRole() called without valid roles');
  }

  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required'));
    if (!allowed.includes(req.user.role)) {
      return next(ApiError.forbidden('Your role does not permit this action'));
    }
    return next();
  };
}

/** Admin-only shortcut used by the user management API. */
const requireAdmin = requireRole('admin');

module.exports = { authenticate, requireRole, requireAdmin };
