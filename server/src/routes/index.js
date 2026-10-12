'use strict';

const express = require('express');

const env = require('../config/env');
const { API } = require('../config/constants');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const quizRoutes = require('./quizzes.routes');

const router = express.Router();

/** GET /api - small service descriptor (no sensitive data). */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: API.NAME,
      version: API.VERSION,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      endpoints: {
        health: `${API.PREFIX}/health`,
    auth: {
      csrf: `${API.PREFIX}/auth/csrf`,
      register: `POST ${API.PREFIX}/auth/register`,
      login: `POST ${API.PREFIX}/auth/login`,
      logout: `POST ${API.PREFIX}/auth/logout`,
      me: `${API.PREFIX}/auth/me`,
      profile: `PATCH ${API.PREFIX}/auth/profile`,
      password: `PATCH ${API.PREFIX}/auth/password`,
    },
    quizzes: {
      list: `${API.PREFIX}/quizzes`,
      quiz: (id) => `${API.PREFIX}/quizzes/${id}`,
      questions: (id) => `${API.PREFIX}/quizzes/${id}/questions`,
      startAttempt: (id) => `${API.PREFIX}/quizzes/${id}/attempts`,
      attempt: (quizId, attemptId) => `${API.PREFIX}/quizzes/${quizId}/attempts/${attemptId}`,
      saveAnswers: (quizId, attemptId) => `${API.PREFIX}/quizzes/${quizId}/attempts/${attemptId}/answers`,
      submitAttempt: (quizId, attemptId) => `${API.PREFIX}/quizzes/${quizId}/attempts/${attemptId}/submit`,
    },
  },
    },
  });
});

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/quizzes', quizRoutes);

module.exports = router;
