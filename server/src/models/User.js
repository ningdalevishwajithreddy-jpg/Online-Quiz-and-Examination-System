'use strict';

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const { BCRYPT_ROUNDS, ROLES, ROLE_VALUES, USER_STATUS, USER_STATUS_VALUES } = require('../config/constants');
const { EMAIL_PATTERN } = require('../utils/validation');

/**
 * User account.
 *
 * Security notes
 * - `passwordHash` is `select: false`, so it is never returned unless a query
 *   explicitly asks for it with `+passwordHash`.
 * - `role` is only ever written by the seed script or (later) the admin user
 *   management API. Public registration never accepts a role.
 * - Lockout state (`failedLoginAttempts`, `lockUntil`) is stripped from JSON.
 */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be at most 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, 'Email must be at most 254 characters'],
      match: [EMAIL_PATTERN, 'Email is not valid'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: { values: ROLE_VALUES, message: 'Role must be one of: admin, teacher, student, invigilator' },
      default: ROLES.STUDENT,
      required: true,
    },
    status: {
      type: String,
      enum: { values: USER_STATUS_VALUES, message: 'Status must be active or suspended' },
      default: USER_STATUS.ACTIVE,
      required: true,
    },
    failedLoginAttempts: { type: Number, default: 0, min: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    /** Set by the development seed script so demo data is identifiable. */
    seedData: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        return ret;
      },
    },
  },
);

// Seed/login lookups by email; admin listing filters by role + status.
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

/** Hash + store a plaintext password. Only used on register / password change. */
userSchema.methods.setPassword = async function setPassword(plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
  this.passwordChangedAt = new Date();
};

/** Constant-time bcrypt comparison. */
userSchema.methods.verifyPassword = async function verifyPassword(plainPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.isLocked = function isLocked(now = new Date()) {
  return Boolean(this.lockUntil && this.lockUntil > now);
};

/** Seconds until the lock expires (0 when not locked). */
userSchema.methods.lockSecondsRemaining = function lockSecondsRemaining(now = new Date()) {
  if (!this.isLocked(now)) return 0;
  return Math.max(1, Math.ceil((this.lockUntil.getTime() - now.getTime()) / 1000));
};

/**
 * Counts a failed sign-in and locks the account once the threshold is hit.
 * The counter resets when the lock is applied so the next window starts clean.
 */
userSchema.methods.registerFailedLogin = function registerFailedLogin(maxAttempts, lockMinutes) {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= maxAttempts) {
    this.lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
    this.failedLoginAttempts = 0;
  }
  return this;
};

userSchema.methods.resetFailedLogins = function resetFailedLogins() {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  return this;
};

/** The version of the credential set a token was issued against. */
userSchema.methods.credentialVersion = function credentialVersion() {
  return this.passwordChangedAt ? this.passwordChangedAt.getTime() : 0;
};

/** Fields that are safe to send to the owner of the account. */
userSchema.methods.toPublicProfile = function toPublicProfile() {
  return {
    id: String(this._id),
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status,
    seedData: this.seedData,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

userSchema.statics.findByEmailWithHash = function findByEmailWithHash(email) {
  return this.findOne({ email: String(email).trim().toLowerCase() }).select('+passwordHash');
};

/** Recomputes the daily lock state for accounts whose lock has expired. */
userSchema.statics.releaseExpiredLockouts = async function releaseExpiredLockouts() {
  const result = await this.updateMany(
    { lockUntil: { $ne: null, $lte: new Date() } },
    { $set: { lockUntil: null, failedLoginAttempts: 0 } },
  );
  return result.modifiedCount ?? 0;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
