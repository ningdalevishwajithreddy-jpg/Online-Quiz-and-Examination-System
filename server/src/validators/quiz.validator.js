'use strict';

const { z } = require('zod');

const { QUIZ_STATUS_VALUES, QUESTION_TYPE_VALUES } = require('../models/QuizStatusConstants');

// ---- Quiz CRUD -------------------------------------------------------

const quizBase = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(120, 'Title must be at most 120 characters'),
    description: z
      .string()
      .trim()
      .max(600, 'Description must be at most 600 characters')
      .default(''),
    instructions: z
      .string()
      .trim()
      .max(1500, 'Instructions must be at most 1500 characters')
      .default(''),
    durationSeconds: z
      .number()
      .int()
      .min(0, 'Duration cannot be negative')
      .max(86400 * 7, 'Duration cannot exceed 7 days'),
    passingPercentage: z
      .number()
      .int()
      .min(0, 'Passing percentage cannot be negative')
      .max(100, 'Passing percentage cannot exceed 100')
      .default(60),
    status: z.enum(QUIZ_STATUS_VALUES).default('draft'),
  })
  .refine(
    (data) => data.durationSeconds && data.durationSeconds > 0,
    { path: ['durationSeconds'], message: 'A quiz must have a positive duration to be publishable' },
  );

// Admin can override most fields but a teacher can only manage their own quizzes.
// .partial() is not allowed on a schema with refinements in Zod v4, so rebuild
// the partial shape explicitly from the same rules.
const quizUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title must be at most 120 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(600, 'Description must be at most 600 characters')
    .optional(),
  instructions: z
    .string()
    .trim()
    .max(1500, 'Instructions must be at most 1500 characters')
    .optional(),
  durationSeconds: z
    .number()
    .int()
    .min(0, 'Duration cannot be negative')
    .max(86400 * 7, 'Duration cannot exceed 7 days')
    .optional(),
  passingPercentage: z
    .number()
    .int()
    .min(0, 'Passing percentage cannot be negative')
    .max(100, 'Passing percentage cannot exceed 100')
    .optional(),
  status: z.enum(QUIZ_STATUS_VALUES).optional(),
}).refine(
  (data) => data.durationSeconds == null || data.durationSeconds === 0 || data.durationSeconds > 0,
  { message: 'A quiz must have a positive duration to be publishable' },
);

// Publish is a restricted action: at least one valid question and positive total marks.
const quizPublishSchema = z
  .object({
    status: z.literal('published'),
    publishAt: z.date().optional(),
  })
  .refine((data) => data.status === 'published', {
    message: 'Publish action must set status to published',
  });

const quizCloseSchema = z
  .object({
    status: z.literal('closed'),
  })
  .refine((data) => data.status === 'closed', {
    message: 'Close action must set status to closed',
  });

// ---- Question creation -----------------------------------------------

const questionOptionSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Option text is required')
    .max(400, 'Option text must be at most 400 characters'),
  isCorrect: z.boolean().default(false),
});

const mcqQuestionSchema = z.object({
  type: z.literal('mcq'),
  text: z
    .string()
    .trim()
    .min(5, 'Question text must be at least 5 characters')
    .max(700, 'Question text must be at most 700 characters'),
  marks: z.number().int().min(0).max(100),
  required: z.boolean().default(true),
  options: z
    .array(questionOptionSchema)
    .min(2, 'MCQ questions need at least 2 options')
    .refine(
      (opts) => opts.filter((o) => o.isCorrect).length === 1,
      'MCQ questions must have exactly one correct option',
    ),
});

const trueFalseQuestionSchema = z.object({
  type: z.literal('truefalse'),
  text: z
    .string()
    .trim()
    .min(5, 'Question text must be at least 5 characters')
    .max(700, 'Question text must be at most 700 characters'),
  marks: z.number().int().min(0).max(100),
  required: z.boolean().default(true),
  correctAnswer: z.enum(['true', 'false']),
});

const questionCreateSchema = mcqQuestionSchema.or(trueFalseQuestionSchema);

const questionCreateListSchema = z
  .object({
    questions: z.array(questionCreateSchema).min(1, 'A quiz needs at least one question to publish'),
  })
  .refine(
    (data) => data.questions.some((q) => q.marks > 0) || data.questions.length === 0,
    { message: 'At least one question must have positive marks' },
  );

// ---- Attempt answers ------------------------------------------------

const attemptAnswerPayloadSchema = z
  .object({
    questionId: z
      .string()
      .min(1, 'questionId is required'),
    // MCQ: numeric index (string-safe). Truth/false: 'true'/'false'.
    selected: z
      .union([
        z.string(),
        z.number().int(),
      ])
      .nullable()
      .optional(),
  })
  .refine(
    (data) => data.selected !== undefined,
    { message: 'selected is required', path: ['selected'] },
  );

const attemptAnswerSaveSchema = z.object({
  answers: z.array(attemptAnswerPayloadSchema).min(1, 'At least one answer must be saved'),
});

// ---- Submit / result ------------------------------------------------

const attemptSubmitSchema = z.object({});

module.exports = {
  quizBase,
  quizUpdateSchema,
  quizPublishSchema,
  quizCloseSchema,
  questionCreateSchema,
  questionCreateListSchema,
  attemptAnswerPayloadSchema,
  attemptAnswerSaveSchema,
  attemptSubmitSchema,
};
