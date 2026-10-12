import { z } from 'zod';

/**
 * Client-side mirror of the server's validation rules.
 *
 * This exists purely for fast inline feedback - the server re-validates every
 * payload and remains the only authority. The messages intentionally match the
 * API so a user never sees two different explanations for the same rule.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

const emailPattern = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

export const emailField = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .refine((value) => value.length <= 254, 'Email must be at most 254 characters')
  .refine((value) => emailPattern.test(value), 'Enter a valid email address');

export const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

export const nameField = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(80, 'Name must be at most 80 characters');

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
});

export const profileSchema = z.object({
  name: nameField,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current password',
  });
