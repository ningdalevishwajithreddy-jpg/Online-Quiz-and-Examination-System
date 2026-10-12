'use strict';

const bcrypt = require('bcrypt');

const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { BCRYPT_ROUNDS, ROLES, USER_STATUS } = require('../config/constants');
const auditService = require('./auditService');

/**
 * Authentication business logic. Controllers stay thin: they only translate
 * service results into HTTP (cookies, status codes).
 */

/** Deliberately identical for unknown email and wrong password. */
const GENERIC_LOGIN_ERROR = 'Invalid email or password';

let dummyHashPromise = null;
/**
 * Comparing against a dummy hash when the account does not exist keeps the
 * response time of "unknown email" and "wrong password" similar, so timing
 * cannot be used to enumerate accounts.
 */
function getDummyHash() {
  if (!dummyHashPromise) {
    dummyHashPromise = bcrypt.hash('quizsphere-timing-equaliser', BCRYPT_ROUNDS);
  }
  return dummyHashPromise;
}

/**
 * Public registration always creates a STUDENT.
 * The role is hardcoded here - it is never read from the request body, so a
 * client cannot promote itself. Other roles are provisioned by an admin or the
 * development seed script.
 */
async function registerStudent({ name, email, password }, req = null) {
  const normalisedEmail = email.trim().toLowerCase();

  const existing = await User.findOne({ email: normalisedEmail }).select('_id');
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = new User({
    name: name.trim(),
    email: normalisedEmail,
    role: ROLES.STUDENT,
    status: USER_STATUS.ACTIVE,
  });
  await user.setPassword(password);
  await user.save();

  await auditService.record({
    action: 'auth.register',
    actorId: user._id,
    actorRole: user.role,
    entityType: 'User',
    entityId: user._id,
    metadata: { email: normalisedEmail },
    req,
  });

  return user;
}

/**
 * Verifies credentials, applies lockout policy and records an audit entry.
 * Every failure path returns the same generic message (except lockout, which
 * the user must know about to be able to recover).
 */
async function login({ email, password }, req = null) {
  const normalisedEmail = email.trim().toLowerCase();
  const user = await User.findByEmailWithHash(normalisedEmail);

  if (!user) {
    await bcrypt.compare(password, await getDummyHash());
    await auditService.record({
      action: 'auth.login_failed',
      entityType: 'User',
      metadata: { email: normalisedEmail, reason: 'unknown_account' },
      req,
    });
    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
  }

  if (user.isLocked()) {
    const secondsRemaining = user.lockSecondsRemaining();
    await auditService.record({
      action: 'auth.login_locked',
      actorId: user._id,
      actorRole: user.role,
      entityType: 'User',
      entityId: user._id,
      metadata: { email: normalisedEmail, secondsRemaining },
      req,
    });
    throw ApiError.tooManyRequests(
      `This account is temporarily locked after repeated failed sign-ins. Try again in ${Math.ceil(secondsRemaining / 60)} minute(s).`,
    );
  }

  const passwordMatches = await user.verifyPassword(password);

  if (!passwordMatches) {
    user.registerFailedLogin(env.ACCOUNT_LOCK_MAX_ATTEMPTS, env.ACCOUNT_LOCK_MINUTES);
    await user.save();

    await auditService.record({
      action: 'auth.login_failed',
      actorId: user._id,
      actorRole: user.role,
      entityType: 'User',
      entityId: user._id,
      metadata: {
        email: normalisedEmail,
        reason: 'bad_password',
        attemptsUntilLock: user.isLocked()
          ? 0
          : Math.max(0, env.ACCOUNT_LOCK_MAX_ATTEMPTS - user.failedLoginAttempts),
      },
      req,
    });

    throw ApiError.unauthorized(GENERIC_LOGIN_ERROR);
  }

  // Credentials are correct but the account is disabled: say so, but only
  // after the password has been verified.
  if (user.status !== USER_STATUS.ACTIVE) {
    await auditService.record({
      action: 'auth.login_blocked',
      actorId: user._id,
      actorRole: user.role,
      entityType: 'User',
      entityId: user._id,
      metadata: { email: normalisedEmail, reason: 'suspended' },
      req,
    });
    throw ApiError.forbidden('This account is not available. Please contact an administrator.');
  }

  user.resetFailedLogins();
  user.lastLoginAt = new Date();
  await user.save();

  await auditService.record({
    action: 'auth.login_succeeded',
    actorId: user._id,
    actorRole: user.role,
    entityType: 'User',
    entityId: user._id,
    metadata: { email: normalisedEmail },
    req,
  });

  return user;
}

async function getAccount(userId) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.unauthorized('Your session is no longer valid. Please sign in again.');
  return user;
}

/** Only the display name is self-editable; email changes need re-verification. */
async function updateProfile(userId, { name }, req = null) {
  const user = await getAccount(userId);
  const previousName = user.name;

  if (name.trim() !== user.name) {
    user.name = name.trim();
    await user.save();
  }

  await auditService.record({
    action: 'auth.profile_updated',
    actorId: user._id,
    actorRole: user.role,
    entityType: 'User',
    entityId: user._id,
    metadata: { nameChanged: previousName !== user.name },
    req,
  });

  return user;
}

/**
 * Changing the password bumps `passwordChangedAt`, which invalidates every
 * previously issued token (including the caller's). The controller immediately
 * issues a fresh cookie so the current session survives.
 */
async function changePassword(userId, { currentPassword, newPassword }, req = null) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Your session is no longer valid. Please sign in again.');

  const currentMatches = await user.verifyPassword(currentPassword);
  if (!currentMatches) {
    await auditService.record({
      action: 'auth.password_change_failed',
      actorId: user._id,
      actorRole: user.role,
      entityType: 'User',
      entityId: user._id,
      metadata: { reason: 'bad_current_password' },
      req,
    });
    throw ApiError.unauthorized('Current password is incorrect');
  }

  if (await user.verifyPassword(newPassword)) {
    throw ApiError.validation([
      { field: 'newPassword', message: 'New password must be different from the current password' },
    ], 'Choose a different password');
  }

  await user.setPassword(newPassword);
  user.resetFailedLogins();
  await user.save();

  await auditService.record({
    action: 'auth.password_changed',
    actorId: user._id,
    actorRole: user.role,
    entityType: 'User',
    entityId: user._id,
    metadata: {},
    req,
  });

  return user;
}

module.exports = {
  GENERIC_LOGIN_ERROR,
  changePassword,
  getAccount,
  login,
  registerStudent,
  updateProfile,
};
