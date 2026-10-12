'use strict';

const mongoose = require('mongoose');

const attemptAnswerSchema = new mongoose.Schema(
  {
    attempt: {
      type: mongoose.Types.ObjectId,
      ref: 'QuizAttempt',
      required: true,
      index: true,
    },
    // The question this answer targets (by id at save time).
    questionId: {
      type: mongoose.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    // For MCQ: the 0-based index of the option the student selected (as a string
    // so it stays stable across serialization). For true/false: "true" or "false".
    selected: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // When this answer was last saved (server time, not client clock).
    savedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: false,
    versionKey: false,
    toJSON: {
      transform(doc, ret) {
        delete ret._id;
        return ret;
      },
    },
  },
);

attemptAnswerSchema.index({ attempt: 1, questionId: 1 }, { unique: true });

const AttemptAnswer = mongoose.model('AttemptAnswer', attemptAnswerSchema);

module.exports = AttemptAnswer;
