'use strict';

const env = require('../config/env');
const authService = require('../services/authService');
const auditService = require('../services/auditService');
const { signAccessToken } = require('../services/tokenService');
const asyncHandler = require('../utils/asyncHandler');
const { clearAuthCookie, setAuthCookie } = require('../utils/authCookies');
const { sendSuccess } = require('../utils/apiResponse');
const { ROLE_LABELS } = require('../config/constants');

/** Starts a session: signs a token and stores it in the httpOnly cookie. */
function startSession(res, user) {
  setAuthCookie(res, signAccessToken(user));
  return user;
}

const register = asyncHandler(async (req, res) => {
  const user = await authService.registerStudent(req.body, req);
  startSession(res, user);
  return sendSuccess(res, { user: user.toPublicProfile() }, {
    statusCode: 201,
    message: 'Account created. Welcome to QuizSphere.',
  });
});

const login = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body, req);
  startSession(res, user);
  return sendSuccess(res, { user: user.toPublicProfile() }, { message: 'Signed in successfully.' });
});

const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);

  if (req.user) {
    await auditService.record({
      action: 'auth.logout',
      actorId: req.user._id,
      actorRole: req.user.role,
      entityType: 'User',
      entityId: req.user._id,
      req,
    });
  }

  return sendSuccess(res, { loggedOut: true }, { message: 'Signed out.' });
});

const getMe = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    user: req.user.toPublicProfile(),
    roleLabel: ROLE_LABELS[req.user.role] || req.user.role,
  }));

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body, req);
  return sendSuccess(res, { user: user.toPublicProfile() }, { message: 'Profile updated.' });
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await authService.changePassword(req.user._id, req.body, req);
  // The old token is now invalid (credential version changed) - re-issue one.
  startSession(res, user);
  return sendSuccess(res, { user: user.toPublicProfile() }, {
    message: 'Password changed. Other devices have been signed out.',
  });
});

/**
 * Hands the double-submit CSRF token to the client. Not a secret: it only has
 * value to a script running on the allowed origin, because a foreign origin
 * cannot read the cookie to echo it back in the header.
 */
const getCsrfToken = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    csrfToken: req.csrfToken,
    headerName: env.CSRF_HEADER_NAME,
    cookieName: env.CSRF_COOKIE_NAME,
  }));

module.exports = {
  changePassword,
  getCsrfToken,
  getMe,
  login,
  logout,
  register,
  updateProfile,
};
