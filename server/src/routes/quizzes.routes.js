'use strict';

const express = require('express');

const { authenticate, requireRole } = require('../middleware/auth');
const quizController = require('../controllers/quiz.controller');
const quizValidators = require('../validators/quiz.validator');
const validate = require('../middleware/validate');
const { questionCreateSchema } = quizValidators;

const router = express.Router();

// Every quiz route requires a valid session. Role-based authorization is
// enforced inside the service/controller, not only here, so a role check in
// middleware alone never grants authority.
router.use(authenticate);

router
  .route('/')
  .get(quizController.listQuizzes)
  .post(requireRole('teacher', 'admin'), validate(quizValidators.quizBase), quizController.createQuiz);

router
  .route('/:quizId')
  .get(quizController.getQuiz)
  .patch(requireRole('teacher', 'admin'), validate(quizValidators.quizUpdateSchema), quizController.updateQuiz)
  .delete(requireRole('teacher', 'admin'), quizController.deleteQuiz);

router
  .route('/:quizId/publish')
  .post(requireRole('teacher', 'admin'), quizController.publishQuiz);

router
  .route('/:quizId/close')
  .post(requireRole('teacher', 'admin'), quizController.closeQuiz);

router
  .route('/:quizId/questions')
  .post(requireRole('teacher', 'admin'), validate(quizValidators.questionCreateListSchema), quizController.addQuestions);

router
  .route('/:quizId/questions/answers')
  .get(quizController.getAttemptAnswers);

router
  .route('/:quizId/attempts')
  .post(quizController.startAttempt)
  .get(quizController.listAttempts);

router
  .route('/:quizId/attempts/:attemptId')
  .get(quizController.getAttempt)
  .post(quizController.submitAttempt);

router
  .patch('/:quizId/attempts/:attemptId/answers', quizController.saveAnswers);

// Scheduler-only helper; in production this would live behind an internal auth
// check. Here it is reachable by any authenticated user so the in-memory dev
// environment can exercise auto-submit during testing.
router.post('/auto-submit-expired', quizController.autoSubmitExpired);

module.exports = router;
