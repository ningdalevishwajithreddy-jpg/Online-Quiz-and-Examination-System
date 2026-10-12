'use strict';

const asyncHandler = require('../utils/asyncHandler');
const quizService = require('../services/quizService');

// The client helper is server-only in this file only for field-error shaping
// when the Zod validation middleware throws. It is imported below.

/** GET /api/quizzes — list quizzes visible to the current user. */
function listQuizzes(req, res) {
  const role = req.user.role;
  const userId = req.user._id;
  const { status, search } = req.query;
  const quizzes = quizService.listQuizzes({
    ownerId: userId,
    role,
    status: status || undefined,
    search: search || undefined,
  });
  return res.json({ success: true, data: { quizzes } });
}

/** GET /api/quizzes/:quizId — quiz summary. */
function getQuiz(req, res) {
  const quiz = quizService.getQuizById(req.params.quizId, {
    role: req.user.role,
    userId: req.user._id,
  });
  return res.json({ success: true, data: { quiz } });
}

/** GET /api/quizzes/:quizId/questions — quiz with questions (display shape only). */
function getQuizQuestions(req, res) {
  const quiz = quizService.getQuizWithQuestions(req.params.quizId, {
    role: req.user.role,
    userId: req.user._id,
  });
  return res.json({ success: true, data: { quiz } });
}

/** POST /api/quizzes — create a quiz (teacher or admin). */
function createQuiz(req, res) {
  const quiz = quizService.createQuiz(req.user, req.body);
  return res.status(201).json({ success: true, data: { quiz } });
}

/** PATCH /api/quizzes/:quizId — update a quiz (owner or admin). */
function updateQuiz(req, res) {
  const quiz = quizService.updateQuiz(req.user, req.params.quizId, req.body);
  return res.json({ success: true, data: { quiz } });
}

/** POST /api/quizzes/:quizId/publish — publish a draft quiz. */
function publishQuiz(req, res) {
  const quiz = quizService.publishQuiz(req.user, req.params.quizId);
  return res.json({ success: true, data: { quiz } });
}

/** POST /api/quizzes/:quizId/close — close a published quiz. */
function closeQuiz(req, res) {
  const quiz = quizService.closeQuiz(req.user, req.params.quizId);
  return res.json({ success: true, data: { quiz } });
}

/** DELETE /api/quizzes/:quizId — delete a quiz + its questions + attempts. */
function deleteQuiz(req, res) {
  const result = quizService.deleteQuiz(req.user, req.params.quizId);
  return res.json({ success: true, data: result });
}

/** POST /api/quizzes/:quizId/questions — add questions to a draft quiz. */
function addQuestions(req, res) {
  const questions = quizService.addQuestionsToQuiz(req.user, req.params.quizId, req.body.questions);
  return res.status(201).json({ success: true, data: { questions } });
}

/** GET /api/quizzes/:quizId/answers — pending answers for a student's active attempt. */
function getAttemptAnswers(req, res) {
  const attempt = quizService.getAttempt(req.params.attemptId, {
    userId: req.user._id,
    role: req.user.role,
  });
  return res.json({ success: true, data: { attempt } });
}

/** PATCH /api/quizzes/:quizId/attempts/:attemptId/answers — autosave answers. */
function saveAnswers(req, res) {
  const result = quizService.saveAttemptAnswers(
    req.params.attemptId,
    req.user._id,
    req.body.answers,
  );
  return res.json({ success: true, data: result });
}

/** POST /api/quizzes/:quizId/attempts/:attemptId/submit — submit + grade. */
function submitAttempt(req, res) {
  const result = quizService.submitAttempt(req.params.attemptId, req.user._id);
  return res.json({ success: true, data: result });
}

/** Re-check deadline on every autosave + submit server-side (already enforced by the service). */
function healthCheck(req, res) {
  return res.json({ success: true, data: { ok: true } });
}

/** POST /api/quizzes/:quizId/attempts — start a new attempt. */
function startAttempt(req, res) {
  const attempt = quizService.startAttempt(req.user, req.params.quizId);
  return res.status(201).json({ success: true, data: { attempt } });
}

/** GET /api/quizzes/:quizId/attempts — list attempts (owner or student scoped). */
function listAttempts(req, res) {
  const attempts = quizService.listStudentAttempts(req.user._id, {
    quizId: req.query.quizId || undefined,
    role: req.user.role,
    ownerId: req.user._id,
  });
  return res.json({ success: true, data: { attempts } });
}

/** GET /api/quizzes/:quizId/attempts/:attemptId — single attempt (result if submitted). */
function getAttempt(req, res) {
  const attempt = quizService.getAttempt(req.params.attemptId, {
    userId: req.user._id,
    role: req.user.role,
  });
  return res.json({ success: true, data: { attempt } });
}

/** POST /api/quizzes/auto-submit-expired — scheduler-only helper for in-memory cleanup. */
function autoSubmitExpired(req, res) {
  const results = quizService.autoSubmitExpiredAttempts();
  return res.json({ success: true, data: { autoSubmitted: results.length } });
}

module.exports = {
  addQuestions,
  autoSubmitExpired,
  closeQuiz,
  createQuiz,
  deleteQuiz,
  getAttempt,
  getAttemptAnswers,
  getQuiz,
  getQuizQuestions,
  listAttempts,
  listQuizzes,
  publishQuiz,
  saveAnswers,
  startAttempt,
  submitAttempt,
  updateQuiz,
};
