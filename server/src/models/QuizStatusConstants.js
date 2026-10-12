'use strict';

/** Quiz lifecycle status. */
const QUIZ_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
});

const QUIZ_STATUS_VALUES = Object.freeze(Object.values(QUIZ_STATUS));

/** Question types supported by the grading engine. */
const QUESTION_TYPES = Object.freeze({
  MCQ: 'mcq',
  TRUE_FALSE: 'truefalse',
});

const QUESTION_TYPE_VALUES = Object.freeze(Object.values(QUESTION_TYPES));

module.exports = {
  QUIZ_STATUS,
  QUIZ_STATUS_VALUES,
  QUESTION_TYPES,
  QUESTION_TYPE_VALUES,
};
