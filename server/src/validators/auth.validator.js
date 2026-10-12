'use strict';

const { z } = require('zod');

const { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } = require('../config/constants');
const { isEmail } = require('../utils/validation');

/**
 * Auth request schemas.
 *
 * All schemas are strict: unknown keys are a validation error. That is how
 * attempts to smuggle `role`, `status`, `score` or `id` through a public
 * endpoint are refused loudly instead of being silently dropped.
 */

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(80, 'Name must be at most 80 characters');

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(254, 'Email must be at most 254 characters')
  .refine(isEmail, 'Enter a valid email address');

/** >= 8 characters containing at least one letter and one number. */
const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

const registerSchema = z.strictObject({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(PASSWORD_MAX_LENGTH, 'Password is too long'),
});

const updateProfileSchema = z.strictObject({
  name: nameSchema,
});

const changePasswordSchema = z.strictObject({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

module.exports = {
  changePasswordSchema,
  emailSchema,
  loginSchema,
  nameSchema,
  passwordSchema,
  registerSchema,
  updateProfileSchema,
};
