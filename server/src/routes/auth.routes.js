'use strict';

const express = require('express');

const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const schemas = require('../validators/auth.validator');

const router = express.Router();

/**
 * Reuses the rate limiters created in app.js (they are stored on app.locals so
 * tests can swap in stricter limits without re-importing the app).
 */
const withLimiter = (name) => (req, res, next) => req.app.locals.rateLimiters[name](req, res, next);

router.get('/csrf', authController.getCsrfToken);

router.post('/register', withLimiter('auth'), validate(schemas.registerSchema), authController.register);
router.post('/login', withLimiter('auth'), validate(schemas.loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);

router.get('/me', authenticate, authController.getMe);
router.patch(
  '/profile',
  withLimiter('write'),
  authenticate,
  validate(schemas.updateProfileSchema),
  authController.updateProfile,
);
router.patch(
  '/password',
  withLimiter('auth'),
  authenticate,
  validate(schemas.changePasswordSchema),
  authController.changePassword,
);

module.exports = router;
