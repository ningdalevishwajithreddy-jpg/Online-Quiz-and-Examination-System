'use strict';

const mongoose = require('mongoose');

const { QUIZ_STATUS, QUIZ_STATUS_VALUES } = require('./QuizStatusConstants');
const { ATTEMPT_STATUS, ATTEMPT_STATUS_VALUES } = require('../config/constants');

const attemptSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // One active attempt per student per quiz.
    status: {
      type: String,
      enum: {
        values: ATTEMPT_STATUS_VALUES,
        message: 'Status must be in_progress, submitted or expired_auto_submitted',
      },
      default: 'in_progress',
      required: true,
    },
    // Server-computed absolute deadline: startedAt + quiz.durationSeconds.
    deadline: {
      type: Date,
      required: true,
    },
    // Duration in seconds that this attempt was created with (snapshot of quiz.durationSeconds).
    durationSeconds: {
      type: Number,
      required: true,
    },
    // Snapshot of the quiz at attempt creation time, so grading uses the same
    // questions/marks/passingPercentage the student started with.
    questionSnapshot: {
      type: {
        quizTitle: { type: String, default: '' },
        passingPercentage: { type: Number, default: 0 },
        totalMarks: { type: Number, default: 0 },
        questionCount: { type: Number, default: 0 },
        questions: [
          {
            id: { type: mongoose.Types.ObjectId, default: null },
            order: { type: Number, default: 0 },
            text: { type: String, default: '' },
            type: { type: String, default: '' },
            marks: { type: Number, default: 0 },
            required: { type: Boolean, default: true },
            // Answer-key snapshot the student answered against.
            answerKey: { type: mongoose.Schema.Types.Mixed, default: null },
            options: [
              {
                id: { type: String, default: '' },
                text: { type: String, default: '' },
              },
            ],
          },
        ],
      },
      default: () => ({
        quizTitle: '',
        passingPercentage: 0,
        totalMarks: 0,
        questionCount: 0,
        questions: [],
      }),
      set: (val) => val,
    },
    // Final result. Only populated on submit (or auto-submit on expiry).
    score: {
      type: Number,
      default: null,
      min: [0, 'Score cannot be negative'],
    },
    maxMarks: {
      type: Number,
      default: null,
    },
    percentage: {
      type: Number,
      default: null,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100'],
    },
    passed: {
      type: Boolean,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    // Demo flag.
    seedData: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(doc, ret) {
        delete ret._id;
        return ret;
      },
      virtuals: true,
    },
  },
);

attemptSchema.index({ student: 1, quiz: 1 }, { unique: true });

/** The duration of time remaining on the attempt (0 when over). */
attemptSchema.virtual('secondsRemaining').get(function () {
  if (this.status !== 'in_progress') return 0;
  const remaining = this.deadline.getTime() - Date.now();
  return Math.max(0, Math.round(remaining / 1000));
});

/** Whether this attempt can still be worked on. */
attemptSchema.virtual('isOpen').get(function () {
  if (this.status !== 'in_progress') return false;
  return this.secondsRemaining > 0;
});

const Attempt = mongoose.model('QuizAttempt', attemptSchema);

module.exports = Attempt;
