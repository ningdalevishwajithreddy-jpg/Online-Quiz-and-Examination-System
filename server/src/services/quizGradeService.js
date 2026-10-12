'use strict';

const { QUESTION_TYPES } = require('../models/QuizStatusConstants');

/**
 * Grading engine.
 *
 * Rules
 * - Grading is idempotent: a submitted attempt can only be graded once, and only
 *   if the quiz's total marks are greater than zero (a zero-total quiz can never
 *   be graded, because there is nothing to score).
 * - The answer key comes from the attempt's questionSnapshot (written at attempt
 *   creation / publish), not from the live question documents, so a published
 *   quiz cannot be re-keyed under a live attempt.
 * - Only `required` questions count toward the total marks used for grading.
 *   Non-required questions are not penalised when left blank.
 */

function resultForAttempt(attempt) {
  return {
    id: attempt._id,
    quizId: attempt.quiz,
    quizTitle: attempt.questionSnapshot?.quizTitle || '',
    status: attempt.status,
    score: attempt.score,
    maxMarks: attempt.maxMarks,
    percentage: attempt.percentage,
    passed: attempt.passed,
    submittedAt: attempt.submittedAt,
    attemptedAt: attempt.createdAt,
    // Derived time info for the runner result screen.
    deadline: attempt.deadline,
    durationSeconds: attempt.durationSeconds,
  };
}

/**
 * Grade an in-progress attempt from its saved answers and its question snapshot.
 * Returns the computed result without mutating the attempt document (the caller
 * writes it back).
 */
function gradeAttempt(attempt, answersByQuestionId) {
  const snapshot = attempt.questionSnapshot;
  if (!snapshot || !Array.isArray(snapshot.questions)) {
    return {
      score: 0,
      maxMarks: 0,
      percentage: 0,
      passed: false,
      breakdown: [],
      totalMarksConsidered: 0,
    };
  }

  const questions = snapshot.questions;
  const totalMarks = questions.reduce((sum, q) => (q.required ? sum + q.marks : sum), 0);
  let score = 0;
  const breakdown = [];

  for (const question of questions) {
    const isRequired = Boolean(question.required);
    const answer = answersByQuestionId?.get?.(question.id) ?? answersByQuestionId?.get?.(String(question.id));

    const grading = gradeOneQuestion(question, answer);
    if (isRequired) {
      score += grading.earned;
    }
    breakdown.push({
      questionId: question.id,
      order: question.order,
      text: question.text,
      type: question.type,
      marks: question.marks,
      required: question.required,
      answerKey: question.answerKey,
      studentAnswer: answer,
      earned: grading.earned,
      maxMarks: question.marks,
      correct: grading.correct,
    });
  }

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;
  const passed = totalMarks > 0 && snapshot.passingPercentage != null && percentage >= snapshot.passingPercentage;

  return {
    score,
    maxMarks: totalMarks,
    percentage,
    passed,
    breakdown,
    totalMarksConsidered: totalMarks,
  };
}

/**
 * Grade a single question against a student answer.
 *
 * - MCQ: correct when the selected option index matches the snapshot correct option index.
 * - True/false: correct when the selected value equals the snapshot correct answer.
 * - No answer / null: 0 marks, not correct.
 * - Wrong answer: 0 marks (no negative marking in Phase 1). Negative marking can be
 *   added later as a quiz-wide setting; for now every question is all-or-nothing.
 */
function gradeOneQuestion(question, answer) {
  const { type, marks, answerKey } = question;
  if (marks <= 0) return { earned: 0, correct: false };

  if (answer === null || answer === undefined || answer === '') {
    return { earned: 0, correct: false };
  }

  const normalized = String(answer).trim();

  if (type === QUESTION_TYPES.MCQ) {
    const correctIndex = answerKey?.correctOptionIndex;
    if (correctIndex == null) return { earned: 0, correct: false };
    const selectedIndex = Number(normalized);
    const correct = Number.isFinite(selectedIndex) && selectedIndex >= 0 && selectedIndex === correctIndex;
    return { earned: correct ? marks : 0, correct };
  }

  if (type === QUESTION_TYPES.TRUE_FALSE) {
    const correctAnswer = answerKey?.correctAnswer;
    if (!correctAnswer) return { earned: 0, correct: false };
    const correct = normalized.toLowerCase() === correctAnswer.toLowerCase();
    return { earned: correct ? marks : 0, correct };
  }

  return { earned: 0, correct: false };
}

module.exports = {
  gradeAttempt,
  resultForAttempt,
};
