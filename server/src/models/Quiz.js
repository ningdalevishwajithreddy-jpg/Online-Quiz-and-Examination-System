'use strict';

const mongoose = require('mongoose');

const { ROLES } = require('../config/constants');
const { QUIZ_STATUS, QUIZ_STATUS_VALUES } = require('./QuizStatusConstants');

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [600, 'Description must be at most 600 characters'],
      default: '',
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [1500, 'Instructions must be at most 1500 characters'],
      default: '',
    },
    owner: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ownerRole: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: ROLES.TEACHER,
    },
    status: {
      type: String,
      enum: {
        values: QUIZ_STATUS_VALUES,
        message: 'Status must be draft, published or closed',
      },
      default: 'draft',
      required: true,
    },
    // Duration of each attempt in seconds. 0 means "no time limit" (used sparingly).
    durationSeconds: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [0, 'Duration cannot be negative'],
      max: [86400 * 7, 'Duration cannot exceed 7 days'],
    },
    passingPercentage: {
      type: Number,
      required: true,
      min: [0, 'Passing percentage cannot be negative'],
      max: [100, 'Passing percentage cannot exceed 100'],
      default: 60,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: [0, 'Total marks cannot be negative'],
      default: 0,
      get: (v) => Math.round(v),
    },
    // Ordered list of question ids for display order + grading order.
    questionIds: {
      type: [{ type: mongoose.Types.ObjectId, ref: 'Question' }],
      default: [],
    },
    // Snapshot of answer-key metadata written at publish time, so grading later
    // uses the same keys the student saw (see Question.publishedSnapshot).
    publishedSnapshot: {
      type: {
        questionCount: { type: Number, default: 0 },
        totalMarks: { type: Number, default: 0 },
        passingPercentage: { type: Number, default: 60 },
      },
      default: () => ({ questionCount: 0, totalMarks: 0, passingPercentage: 60 }),
    },
    // When the quiz was opened to students.
    publishedAt: {
      type: Date,
      default: null,
    },
    // When the quiz was closed. Closed quizzes accept no new attempts.
    closedAt: {
      type: Date,
      default: null,
    },
    // Demo flag so seeded content is identifiable and removable.
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

quizSchema.index({ owner: 1, status: 1 });
quizSchema.index({ status: 1, publishedAt: -1 });
quizSchema.index({ seedData: 1 });

// Read-only accessors.
quizSchema.virtual('isPublished').get(function () {
  return this.status === 'published';
});

quizSchema.virtual('isClosed').get(function () {
  return this.status === 'closed';
});

quizSchema.virtual('canAcceptNewAttempts').get(function () {
  if (this.status === 'closed') return false;
  if (!this.isPublished) return false;
  if (this.closedAt && this.closedAt <= new Date()) return false;
  return true;
});

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
