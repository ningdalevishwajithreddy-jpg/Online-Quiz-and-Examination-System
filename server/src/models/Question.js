'use strict';

const mongoose = require('mongoose');

const { QUESTION_TYPES, QUESTION_TYPE_VALUES } = require('./QuizStatusConstants');

const questionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },
    order: {
      type: Number,
      required: true,
      min: [1, 'Question order must be at least 1'],
    },
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: [5, 'Question text must be at least 5 characters'],
      maxlength: [700, 'Question text must be at most 700 characters'],
    },
    type: {
      type: String,
      enum: {
        values: QUESTION_TYPE_VALUES,
        message: 'Question type must be mcq or truefalse',
      },
      required: true,
    },
    marks: {
      type: Number,
      required: true,
      min: [0, 'Marks cannot be negative'],
      max: [100, 'Marks cannot exceed 100'],
    },
    required: {
      type: Boolean,
      default: true,
    },
    // MCQ only: ordered options. Exactly one must be marked correct.
    options: {
      type: [
        {
          text: { type: String, required: true, trim: true, maxlength: [400, 'Option text too long'] },
          isCorrect: { type: Boolean, default: false },
        },
      ],
      validate: {
        // Options must be an array with at least 2 entries and exactly one correct.
        validator: function (arr) {
          if (!Array.isArray(arr)) return false;
          if (arr.length < 2) return false;
          const correct = arr.filter((o) => Boolean(o.isCorrect));
          return correct.length === 1;
        },
        message:
          'MCQ questions need at least 2 options with exactly one marked correct',
      },
    },
    // True/false only.
    correctAnswer: {
      type: String,
      enum: {
        values: ['true', 'false'],
        message: 'Correct answer must be true or false',
      },
    },
    // Snapshot of the answer key written at publish time. Grading compares the
    // student's answers against this snapshot, not the live document, so a
    // published quiz's answers cannot be changed after attempts exist.
    publishedSnapshot: {
      type: {
        kind: { type: String, default: '' },
        correctOptionIndex: { type: Number, default: null },
        correctAnswer: { type: String, default: null },
        marks: { type: Number, default: 0 },
        required: { type: Boolean, default: true },
      },
      default: () => ({
        kind: '',
        correctOptionIndex: null,
        correctAnswer: null,
        marks: 0,
        required: true,
      }),
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

questionSchema.index({ quiz: 1, order: 1 });

/** The answer-key value used by the grading service, derived from the live doc. */
questionSchema.virtual('answerKey').get(function () {
  if (this.type === QUESTION_TYPES.TRUE_FALSE) return this.correctAnswer;
  if (this.type === QUESTION_TYPES.MCQ) {
    const idx = this.options.findIndex((o) => o.isCorrect);
    return idx >= 0 ? String(idx) : null;
  }
  return null;
});

/** Stable snapshot written into `publishedSnapshot` at publish time. */
questionSchema.methods.snapshotForPublish = function snapshotForPublish() {
  const snap = { type: this.type, required: Boolean(this.required), marks: this.marks };
  if (this.type === QUESTION_TYPES.TRUE_FALSE) {
    snap.correctAnswer = this.correctAnswer;
    snap.correctOptionIndex = null;
  } else {
    const idx = this.options.findIndex((o) => o.isCorrect);
    snap.correctOptionIndex = idx >= 0 ? idx : null;
    snap.correctAnswer = null;
  }
  return snap;
};

/** Strip everything but the display shape + answer key so clients never see raw answers. */
questionSchema.methods.toPublic = function toPublic() {
  const base = {
    id: this._id,
    order: this.order,
    text: this.text,
    type: this.type,
    marks: this.marks,
    required: this.required,
  };

  if (this.type === QUESTION_TYPES.MCQ) {
    base.options = this.options.map((o, i) => ({ id: String(i), text: o.text }));
  } else {
    base.options = [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ];
  }

  return base;
};

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
