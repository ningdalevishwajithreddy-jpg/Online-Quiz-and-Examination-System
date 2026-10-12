'use strict';

/**
 * Application-wide constants. Anything that is enforced in more than one
 * place (validation, models, authorization, grading) lives here so the
 * server never disagrees with itself.
 */

const ROLES = Object.freeze({
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  INVIGILATOR: 'invigilator',
});

/** The only four roles that exist in QuizSphere. */
const ROLE_VALUES = Object.freeze(Object.values(ROLES));

/** Quiz lifecycle. */
const QUIZ_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
});

const QUIZ_STATUS_VALUES = Object.freeze(Object.values(QUIZ_STATUS));

/** Attempt lifecycle. */
const ATTEMPT_STATUS = Object.freeze({
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  EXPIRED_AUTO_SUBMITTED: 'expired_auto_submitted',
});

const ATTEMPT_STATUS_VALUES = Object.freeze(Object.values(ATTEMPT_STATUS));

/** Human readable labels (used by the client through /api responses). */
const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.TEACHER]: 'Teacher',
  [ROLES.STUDENT]: 'Student',
  [ROLES.INVIGILATOR]: 'Invigilator',
});

const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
});

const USER_STATUS_VALUES = Object.freeze(Object.values(USER_STATUS));

/** Password policy: >= 8 characters containing letters and numbers. */
const PASSWORD_MIN_LENGTH = 8;
/** bcrypt only uses the first 72 bytes - reject longer input instead of silently truncating. */
const PASSWORD_MAX_LENGTH = 72;
/** Required bcrypt cost factor for password hashing. */
const BCRYPT_ROUNDS = 12;

const API = Object.freeze({
  NAME: 'QuizSphere API',
  VERSION: '1.0.0',
  PREFIX: '/api',
});

module.exports = {
  API,
  ATTEMPT_STATUS,
  ATTEMPT_STATUS_VALUES,
  BCRYPT_ROUNDS,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  QUIZ_STATUS,
  QUIZ_STATUS_VALUES,
  ROLES,
  ROLE_LABELS,
  ROLE_VALUES,
  USER_STATUS,
  USER_STATUS_VALUES,
};
