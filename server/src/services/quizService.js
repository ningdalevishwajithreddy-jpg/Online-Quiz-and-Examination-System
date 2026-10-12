'use strict';

const mongoose = require('mongoose');

const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Attempt = require('../models/QuizAttempt');
const AttemptAnswer = require('../models/AttemptAnswer');
const ApiError = require('../utils/ApiError');
const { QUIZ_STATUS, ATTEMPT_STATUS } = require('../config/constants');
const { QUESTION_TYPES } = require('../models/QuizStatusConstants');
const { gradeAttempt, resultForAttempt } = require('./quizGradeService');

// ---- Quiz CRUD -------------------------------------------------------
// Teachers manage only their own quizzes. Admins can see and manage all.

async function listQuizzes({ ownerId, role, status, search }) {
  const filter = {};
  if (role === 'admin') {
    // Admins can filter by status; otherwise see all.
    if (status) filter.status = status;
  } else if (role === 'teacher') {
    // Teachers only see their own.
    filter.owner = ownerId;
    if (status) filter.status = status;
  } else {
    // Student / invigilator: only published quizzes that still accept attempts.
    filter.status = QUIZ_STATUS.PUBLISHED;
    filter.closedAt = { $eq: null };
  }

  const query = Quiz.find(filter)
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();

  if (search && typeof search === 'string' && search.trim().length > 0) {
    query.where({
      $or: [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ],
    });
  }

  const docs = await query;
  return docs.map(normaliseQuiz);
}

async function getQuizById(quizId, { role, userId }) {
  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) throw ApiError.notFound('Quiz not found');

  // Students / invigilators only see published quizzes.
  if (role !== 'admin' && role !== 'teacher') {
    if (quiz.status !== QUIZ_STATUS.PUBLISHED) {
      throw ApiError.notFound('Quiz not found');
    }
    if (quiz.closedAt && quiz.closedAt <= new Date()) {
      throw ApiError.notFound('Quiz not found');
    }
  }

  return normaliseQuiz(quiz);
}

async function getQuizWithQuestions(quizId, { role, userId }) {
  const quiz = await Quiz.findById(quizId)
    .populate({
      path: 'questionIds',
      options: { sort: { order: 1 } },
    })
    .lean();
  if (!quiz) throw ApiError.notFound('Quiz not found');

  if (role !== 'admin' && role !== 'teacher') {
    if (quiz.status !== QUIZ_STATUS.PUBLISHED) {
      throw ApiError.notFound('Quiz not found');
    }
    if (quiz.closedAt && quiz.closedAt <= new Date()) {
      throw ApiError.notFound('Quiz not found');
    }
  }

  const questions = (quiz.questionIds || [])
    .filter(Boolean)
    .map((q) => {
      if (q && typeof q.toPublic === 'function') return q.toPublic();
      // Already lean-populated; build a public shape from the raw doc.
      return {
        id: q._id,
        order: q.order,
        text: q.text,
        type: q.type,
        marks: q.marks,
        required: q.required,
        options:
          q.type === QUESTION_TYPES.MCQ
            ? q.options.map((o, i) => ({ id: String(i), text: o.text }))
            : [
                { id: 'true', text: 'True' },
                { id: 'false', text: 'False' },
              ],
      };
    });

  return {
    ...normaliseQuiz(quiz),
    questions,
  };
}

async function createQuiz(owner, data) {
  const quiz = new Quiz({
    ...data,
    owner: owner._id,
    ownerRole: owner.role,
    seedData: Boolean(data.seedData),
  });
  await quiz.save();
  return normaliseQuiz(quiz.toObject());
}

async function updateQuiz(owner, quizId, data) {
  const quiz = await Quiz.findOne({
    _id: quizId,
    $or: [{ owner: owner._id }, { ownerRole: 'admin' }],
  });
  if (!quiz) throw ApiError.notFound('Quiz not found');

  applyQuizUpdate(quiz, data);
  await quiz.save();
  return normaliseQuiz(quiz.toObject());
}

async function publishQuiz(owner, quizId) {
  const quiz = await Quiz.findOne({
    _id: quizId,
    $or: [{ owner: owner._id }, { ownerRole: 'admin' }],
  });
  if (!quiz) throw ApiError.notFound('Quiz not found');
  if (quiz.status !== QUIZ_STATUS.DRAFT) {
    throw ApiError.conflict('Only draft quizzes can be published');
  }

  // Validation: at least one question, positive total marks.
  const totalMarks = await computeTotalMarks(quiz._id);
  if (totalMarks <= 0) {
    throw ApiError.unprocessable('A published quiz must have at least one question with positive marks');
  }

  // Populate the published snapshot + question snapshot so grading later uses
  // the same answer key the student saw.
  const questions = await Question.find({ quiz: quiz._id }).sort({ order: 1 }).lean();
  if (questions.length === 0) {
    throw ApiError.unprocessable('A published quiz must have at least one question');
  }

  const snapshot = buildQuestionSnapshot(quiz, questions);
  quiz.publishedSnapshot = {
    questionCount: questions.length,
    totalMarks,
    passingPercentage: quiz.passingPercentage,
  };
  quiz.status = QUIZ_STATUS.PUBLISHED;
  quiz.publishedAt = new Date();
  quiz.totalMarks = totalMarks;
  quiz.questionSnapshot = snapshot;

  await quiz.save();
  return normaliseQuiz(quiz.toObject());
}

async function closeQuiz(owner, quizId) {
  const quiz = await Quiz.findOne({
    _id: quizId,
    $or: [{ owner: owner._id }, { ownerRole: 'admin' }],
  });
  if (!quiz) throw ApiError.notFound('Quiz not found');
  if (quiz.status !== QUIZ_STATUS.PUBLISHED) {
    throw ApiError.conflict('Only published quizzes can be closed');
  }
  quiz.status = QUIZ_STATUS.CLOSED;
  quiz.closedAt = new Date();
  await quiz.save();
  return normaliseQuiz(quiz.toObject());
}

async function deleteQuiz(owner, quizId) {
  const quiz = await Quiz.findOne({
    _id: quizId,
    $or: [{ owner: owner._id }, { ownerRole: 'admin' }],
  });
  if (!quiz) throw ApiError.notFound('Quiz not found');

  // Cascade: remove questions + attempts + answers.
  await Question.deleteMany({ quiz: quizId });
  await AttemptAnswer.deleteMany({ attempt: { $in: (await Attempt.find({ quiz: quizId }).distinct('_id')) } });
  await Attempt.deleteMany({ quiz: quizId });
  await Quiz.findByIdAndDelete(quizId);

  return { deleted: true };
}

// ---- Questions -------------------------------------------------------

async function addQuestionsToQuiz(owner, quizId, questionsData) {
  const quiz = await Quiz.findOne({
    _id: quizId,
    $or: [{ owner: owner._id }, { ownerRole: 'admin' }],
  });
  if (!quiz) throw ApiError.notFound('Quiz not found');
  if (quiz.status !== QUIZ_STATUS.DRAFT) {
    throw ApiError.conflict('Questions can only be added to draft quizzes');
  }

  const existingOrder = quiz.questionIds.length;
  const created = [];
  const questionIds = [...quiz.questionIds];

  for (const qd of questionsData) {
    const question = new Question({
      quiz: quizId,
      order: existingOrder + created.length + 1,
      text: qd.text,
      type: qd.type,
      marks: qd.marks,
      required: qd.required,
      options: qd.type === QUESTION_TYPES.MCQ ? qd.options : undefined,
      correctAnswer: qd.type === QUESTION_TYPES.TRUE_FALSE ? qd.correctAnswer : undefined,
      publishedSnapshot: qd.type === QUESTION_TYPES.MCQ
        ? {
            kind: 'mcq',
            correctOptionIndex: qd.options.findIndex((o) => o.isCorrect),
            correctAnswer: null,
            marks: qd.marks,
            required: Boolean(qd.required),
          }
        : {
            kind: 'truefalse',
            correctOptionIndex: null,
            correctAnswer: qd.correctAnswer,
            marks: qd.marks,
            required: Boolean(qd.required),
          },
    });
    await question.save();
    questionIds.push(question._id);
    created.push(question);
  }

  quiz.questionIds = questionIds;
  await quiz.save();

  return created.map((q) => ({
    id: q._id,
    order: q.order,
    text: q.text,
    type: q.type,
    marks: q.marks,
    required: q.required,
    options:
      q.type === QUESTION_TYPES.MCQ
        ? q.options.map((o, i) => ({ id: String(i), text: o.text }))
        : [
            { id: 'true', text: 'True' },
            { id: 'false', text: 'False' },
          ],
  }));
}

async function recomputeTotalMarks(quizId) {
  return computeTotalMarks(quizId);
}

// ---- Attempts -------------------------------------------------------

async function getAttempt(attemptId, { userId, role }) {
  const attempt = await Attempt.findById(attemptId)
    .populate({
      path: 'quiz',
      select: '_id title description instructions status durationSeconds passingPercentage totalMarks publishedAt closedAt seedData',
    })
    .lean();
  if (!attempt) throw ApiError.notFound('Attempt not found');

  // Students see only their own attempts. Teachers/admins can see attempts on
  // their own quizzes (or any quiz for admins).
  if (role === 'student') {
    if (String(attempt.student) !== String(userId)) {
      throw ApiError.notFound('Attempt not found');
    }
  } else if (role === 'teacher') {
    if (String(attempt.quiz?.owner) !== String(userId)) {
      throw ApiError.notFound('Attempt not found');
    }
  }

  return normaliseAttempt(attempt);
}

async function listStudentAttempts(studentId, { quizId, role, ownerId }) {
  // Teachers/admins can list attempts on quizzes they own.
  const filter = {};
  if (role === 'student') {
    filter.student = studentId;
  } else if (role === 'teacher') {
    filter.quiz = { $in: await Quiz.find({ owner: ownerId }).distinct('_id') };
  } else if (role === 'admin') {
    // Admins can list all attempts; optionally filtered by quiz.
  } else {
    filter.student = studentId;
  }

  if (quizId) filter.quiz = new mongoose.Types.ObjectId(quizId);

  const attempts = await Attempt.find(filter)
    .populate({
      path: 'quiz',
      select: '_id title status durationSeconds passingPercentage totalMarks publishedAt closedAt seedData',
    })
    .sort({ createdAt: -1 })
    .lean();

  return attempts.map(normaliseAttempt);
}

/**
 * Start an attempt.
 *
 * Rules
 * - The quiz must be published and still accepting attempts.
 * - The student must not already have an active attempt on this quiz.
 * - The deadline is computed server-side from the current time + the quiz's duration.
 * - The question snapshot is written at this point so grading later uses the same
 *   keys the student saw (pins the answer key against edits).
 */
async function startAttempt(student, quizId) {
  const quiz = await Quiz.findById(quizId)
    .populate({
      path: 'questionIds',
      options: { sort: { order: 1 } },
    })
    .lean();
  if (!quiz) throw ApiError.notFound('Quiz not found');
  if (quiz.status !== QUIZ_STATUS.PUBLISHED) {
    throw ApiError.badRequest('Only published quizzes can be attempted');
  }
  if (quiz.closedAt && quiz.closedAt <= new Date()) {
    throw ApiError.badRequest('This quiz is no longer accepting attempts');
  }

  // One active attempt per student per quiz.
  const existingActive = await Attempt.findOne({
    student: student._id,
    quiz: quizId,
    status: ATTEMPT_STATUS.IN_PROGRESS,
  });
  if (existingActive) {
    throw ApiError.conflict('You already have an active attempt for this quiz. Submit it or finish it before starting another.');
  }

  const deadline = new Date(Date.now() + quiz.durationSeconds * 1000);

  // Build the question snapshot (pins the answer key at this moment).
  const questions = await Question.find({ _id: { $in: quiz.questionIds } }).sort({ order: 1 }).lean();
  const questionSnapshot = buildQuestionSnapshot(quiz, questions);

  const attempt = new Attempt({
    quiz: quizId,
    student: student._id,
    status: ATTEMPT_STATUS.IN_PROGRESS,
    deadline,
    durationSeconds: quiz.durationSeconds,
    questionSnapshot,
    totalMarks: quiz.totalMarks || questionSnapshot.totalMarks,
    passingPercentage: quiz.passingPercentage,
    seedData: Boolean(quiz.seedData),
  });
  await attempt.save();

  // Eagerly seed an AttemptAnswer row for every question so autosave can be
  // an upsert that never fails on a missing row.
  const answerRows = questions.map((q) => ({
    attempt: attempt._id,
    questionId: q._id,
    selected: null,
    savedAt: new Date(),
  }));
  if (answerRows.length) {
    await AttemptAnswer.insertMany(answerRows, { ordered: false }).catch((err) => {
      // If some already exist (race), ignore duplicate key errors.
      if (err?.code !== 11000) throw err;
    });
  }

  return normaliseAttempt(attempt.toObject(), { includeQuestionSnapshot: true });
}

/**
 * Save answers for an in-progress attempt (autosave).
 *
 * Each payload item is persisted as an upsert so a partial save never loses the
 * whole set: the request body is authoritative for the questions it includes.
 */
async function saveAttemptAnswers(attemptId, userId, payloads) {
  const attempt = await Attempt.findById(attemptId)
    .populate({ path: 'quiz', select: '_id owner status seedData' })
    .lean();
  if (!attempt) throw ApiError.notFound('Attempt not found');
  if (String(attempt.student) !== String(userId)) {
    throw ApiError.forbidden('You can only save answers on your own attempt');
  }
  if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
    throw ApiError.badRequest('You can only save answers on an active attempt');
  }
  if (!attempt.isOpen) {
    throw ApiError.badRequest('This attempt is no longer open for edits');
  }

  const docs = payloads.map((p) => ({
    attempt: attemptId,
    questionId: p.questionId,
    selected: p.selected,
    savedAt: new Date(),
  }));

  await AttemptAnswer.replaceMany(
    { attempt: attemptId },
    docs,
    { upsert: false },
  ).catch(() => {
    // If a question id is bad, Mongoose will throw a CastError; map it simply.
    throw ApiError.badRequest('One of the question ids in the request is invalid');
  });

  // Persist a single savedAt on the attempt so the client can show "last saved".
  await Attempt.updateOne({ _id: attemptId }, { $set: { 'questionSnapshot.savedAt': new Date() } });

  return { saved: docs.length };
}

/**
 * Submit an attempt: grade it, record the result, mark submitted.
 *
 * Grading is idempotent on the snapshot: a submitted attempt is graded exactly
 * once, from its saved answers and its question snapshot.
 */
async function submitAttempt(attemptId, userId) {
  const attempt = await Attempt.findById(attemptId)
    .populate({ path: 'quiz', select: '_id owner status seedData' })
    .lean();
  if (!attempt) throw ApiError.notFound('Attempt not found');
  if (String(attempt.student) !== String(userId)) {
    throw ApiError.forbidden('You can only submit your own attempt');
  }
  if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
    throw ApiError.badRequest('This attempt has already been submitted');
  }

  // Load the saved answers in question order.
  const answers = await AttemptAnswer.find({ attempt: attemptId }).sort({ questionId: 1 }).lean();
  const answersByQuestionId = new Map(answers.map((a) => [String(a.questionId), a.selected]));

  const grading = gradeAttempt(attempt, answersByQuestionId);

  if (attempt.totalMarks != null && attempt.totalMarks > 0 && grading.totalMarksConsidered === 0) {
    throw ApiError.unprocessable('This quiz has no gradable questions');
  }

  await Attempt.findByIdAndUpdate(attemptId, {
    status: ATTEMPT_STATUS.SUBMITTED,
    score: grading.score,
    maxMarks: grading.maxMarks,
    percentage: grading.percentage,
    passed: grading.passed,
    submittedAt: new Date(),
  });

  const final = await Attempt.findById(attemptId)
    .populate({
      path: 'quiz',
      select: '_id title description instructions status durationSeconds passingPercentage totalMarks publishedAt closedAt seedData',
    })
    .lean();

  return {
    attempt: normaliseAttempt(final),
    result: {
      score: grading.score,
      maxMarks: grading.maxMarks,
      percentage: grading.percentage,
      passed: grading.passed,
      breakdown: grading.breakdown,
    },
  };
}

// ---- Auto-submit on deadline ----------------------------------------

/**
 * Close stale in-progress attempts whose deadline has passed.
 * Called by the scheduler. Safe to run repeatedly.
 */
async function autoSubmitExpiredAttempts() {
  const cutoff = new Date();
  const attempts = await Attempt.find({
    status: ATTEMPT_STATUS.IN_PROGRESS,
    deadline: { $lte: cutoff },
  }).lean();

  const results = [];
  for (const attempt of attempts) {
    const answers = await AttemptAnswer.find({ attempt: attempt._id }).lean();
    const answersByQuestionId = new Map(answers.map((a) => [String(a.questionId), a.selected]));
    const grading = gradeAttempt(attempt, answersByQuestionId);

    await Attempt.findByIdAndUpdate(attempt._id, {
      status: ATTEMPT_STATUS.EXPIRED_AUTO_SUBMITTED,
      score: grading.score,
      maxMarks: grading.maxMarks,
      percentage: grading.percentage,
      passed: grading.passed,
      submittedAt: new Date(),
    });

    results.push({
      attemptId: attempt._id,
      result: {
        score: grading.score,
        maxMarks: grading.maxMarks,
        percentage: grading.percentage,
        passed: grading.passed,
      },
    });
  }

  return results;
}

// ---- Helpers ---------------------------------------------------------

function normaliseQuiz(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  // Mongoose virtuals are available on the model instance; lean docs don't have them.
  const isPublished = String(obj.status) === QUIZ_STATUS.PUBLISHED;
  const isClosed = String(obj.status) === QUIZ_STATUS.CLOSED;
  const canAcceptNewAttempts =
    isPublished &&
    !isClosed &&
    (!obj.closedAt || obj.closedAt <= new Date() === false);

  return {
    id: obj._id,
    title: obj.title,
    description: obj.description || '',
    instructions: obj.instructions || '',
    owner: obj.owner,
    ownerRole: obj.ownerRole,
    status: obj.status,
    durationSeconds: obj.durationSeconds,
    passingPercentage: obj.passingPercentage,
    totalMarks: obj.totalMarks,
    questionCount: obj.questionIds?.length || 0,
    publishedAt: obj.publishedAt,
    closedAt: obj.closedAt,
    seedData: Boolean(obj.seedData),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    // Derived, safe to send to clients.
    isPublished,
    isClosed,
    canAcceptNewAttempts,
  };
}

function normaliseAttempt(doc, opts = {}) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;

  return {
    id: obj._id,
    quiz: obj.quiz ? (typeof obj.quiz === 'object' ? obj.quiz._id : obj.quiz) : null,
    quizTitle: ((obj.questionSnapshot && obj.questionSnapshot.quizTitle) || (obj.quiz && obj.quiz.title) || ''),
    student: obj.student,
    status: obj.status,
    startedAt: obj.createdAt,
    deadline: obj.deadline,
    durationSeconds: obj.durationSeconds,
    secondsRemaining: obj.secondsRemaining,
    isOpen: obj.isOpen,
    questionSnapshot: opts.includeQuestionSnapshot ? obj.questionSnapshot : undefined,
    score: obj.score,
    maxMarks: obj.maxMarks,
    percentage: obj.percentage,
    passed: obj.passed,
    submittedAt: obj.submittedAt,
    seedData: Boolean(obj.seedData),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

async function computeTotalMarks(quizId) {
  const questions = await Question.find({ quiz: quizId }).lean();
  return questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
}

function buildQuestionSnapshot(quiz, questions) {
  return {
    quizTitle: quiz.title,
    passingPercentage: quiz.passingPercentage || 60,
    totalMarks: questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0),
    questionCount: questions.length,
    questions: questions.map((q) => ({
      id: q._id,
      order: q.order,
      text: q.text,
      type: q.type,
      marks: q.marks,
      required: Boolean(q.required),
      answerKey:
        q.type === QUESTION_TYPES.MCQ
          ? { correctOptionIndex: q.publishedSnapshot?.correctOptionIndex ?? q.options?.findIndex((o) => o.isCorrect) ?? null }
          : { correctAnswer: q.publishedSnapshot?.correctAnswer ?? q.correctAnswer ?? null },
      options:
        q.type === QUESTION_TYPES.MCQ
          ? (q.options || []).map((o, i) => ({ id: String(i), text: o.text }))
          : [
              { id: 'true', text: 'True' },
              { id: 'false', text: 'False' },
            ],
    })),
  };
}

module.exports = {
  addQuestionsToQuiz,
  autoSubmitExpiredAttempts,
  closeQuiz,
  createQuiz,
  deleteQuiz,
  getQuizById,
  getQuizWithQuestions,
  listQuizzes,
  listStudentAttempts,
  publishQuiz,
  saveAttemptAnswers,
  startAttempt,
  submitAttempt,
  updateQuiz,
  recomputeTotalMarks,
};
