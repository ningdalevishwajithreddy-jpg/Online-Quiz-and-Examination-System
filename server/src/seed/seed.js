'use strict';

/**
 * Development seed script.
 *
 * Creates one clearly-labelled demo account per role and one published demo quiz
 * that students can actually attempt. It is idempotent (safe to run repeatedly:
 * existing demo accounts are updated, not duplicated) and it refuses to run
 * against NODE_ENV=production unless --force is passed.
 *
 *   npm run seed            (from the repository root)
 *   node src/seed/seed.js   (from server/)
 */

const env = require('../config/env');
const logger = require('../utils/logger');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const { connectDatabase, disconnectDatabase } = require('../config/db');
const { ROLES, ROLE_LABELS } = require('../config/constants');
const { QUESTION_TYPES } = require('../models/QuizStatusConstants');

/** Shared, deliberately non-secret password for demo accounts. */
const DEMO_PASSWORD = 'DemoPass123';

const DEMO_USERS = [
  {
    name: 'Ava Raman',
    email: 'admin@quizsphere.test',
    role: ROLES.ADMIN,
    description: 'Full platform administration',
  },
  {
    name: 'Tejas Nair',
    email: 'teacher@quizsphere.test',
    role: ROLES.TEACHER,
    description: 'Creates and owns quizzes',
  },
  {
    name: 'Sara Iqbal',
    email: 'student@quizsphere.test',
    role: ROLES.STUDENT,
    description: 'Takes timed examinations',
  },
  {
    name: 'Vikram Sethi',
    email: 'invigilator@quizsphere.test',
    role: ROLES.INVIGILATOR,
    description: 'Monitors assigned exam sessions',
  },
];

/**
 * Upserts the demo accounts.
 * @returns {Promise<{created: string[], updated: string[]}>}
 */
async function seedDemoUsers() {
  const created = [];
  const updated = [];

  for (const demo of DEMO_USERS) {
    const existing = await User.findByEmailWithHash(demo.email);
    if (existing) {
      existing.name = demo.name;
      existing.role = demo.role;
      existing.status = 'active';
      existing.resetFailedLogins();
      existing.seedData = true;
      await existing.setPassword(DEMO_PASSWORD);
      await existing.save();
      updated.push(demo.email);
      continue;
    }

    const user = new User({
      name: demo.name,
      email: demo.email,
      role: demo.role,
      status: 'active',
      seedData: true,
    });
    await user.setPassword(DEMO_PASSWORD);
    await user.save();
    created.push(demo.email);
  }

  return { created, updated };
}

// ---- Demo quiz ----------------------------------------------------------------

const DEMO_QUIZ = {
  title: 'Introduction to Computers — Demo Quiz',
  description:
    'A short demonstration quiz covering basic computer concepts. Use it to verify the timed exam flow: start an attempt, save answers, and submit to see the server-computed result.',
  instructions:
    'You have 10 minutes. Answers save automatically. Submit before the time runs out — if the timer expires, your last saved answers are submitted and graded automatically.',
  durationSeconds: 600,
  passingPercentage: 60,
};

const DEMO_QUESTIONS = [
  {
    type: QUESTION_TYPES.MCQ,
    text: 'What does CPU stand for?',
    marks: 10,
    required: true,
    options: [
      { text: 'Central Processing Unit', isCorrect: true },
      { text: 'Computer Personal Unit', isCorrect: false },
      { text: 'Central Program Utility', isCorrect: false },
      { text: 'Central Processor Utility', isCorrect: false },
    ],
  },
  {
    type: QUESTION_TYPES.MCQ,
    text: 'Which of these is an example of an operating system?',
    marks: 10,
    required: true,
    options: [
      { text: 'Microsoft Word', isCorrect: false },
      { text: 'Google Chrome', isCorrect: false },
      { text: 'Windows', isCorrect: true },
      { text: 'Photoshop', isCorrect: false },
    ],
  },
  {
    type: QUESTION_TYPES.TRUE_FALSE,
    text: 'RAM is a type of permanent storage that keeps data after the computer is turned off.',
    marks: 10,
    required: true,
    correctAnswer: 'false',
  },
  {
    type: QUESTION_TYPES.MCQ,
    text: 'What does "HTTP" stand for?',
    marks: 10,
    required: true,
    options: [
      { text: 'HyperText Transfer Protocol', isCorrect: true },
      { text: 'High Tech Transfer Process', isCorrect: false },
      { text: 'HyperTerminal Transfer Process', isCorrect: false },
      { text: 'HyperText Transmission Program', isCorrect: false },
    ],
  },
  {
    type: QUESTION_TYPES.TRUE_FALSE,
    text: 'A compiler translates high-level source code into machine code.',
    marks: 10,
    required: true,
    correctAnswer: 'true',
  },
];

/**
 * Seeds one published demo quiz owned by the teacher demo account, plus its
 * questions and answer key. Idempotent: replaces any existing demo quiz so
 * re-running the seed script keeps the demo dataset stable.
 *
 * @param {string} teacherId
 */
async function seedDemoQuiz(teacherId) {
  // Remove any previous demo quiz so the dataset is stable across re-seeds.
  await Quiz.findOneAndDelete({ title: DEMO_QUIZ.title, seedData: true }).catch(() => {});

  const quiz = new Quiz({
    ...DEMO_QUIZ,
    owner: teacherId,
    ownerRole: ROLES.TEACHER,
    status: 'published',
    publishedAt: new Date(),
    seedData: true,
  });
  await quiz.save();

  const questionDocs = [];
  for (let i = 0; i < DEMO_QUESTIONS.length; i++) {
    const qd = DEMO_QUESTIONS[i];
    const question = new Question({
      quiz: quiz._id,
      order: i + 1,
      text: qd.text,
      type: qd.type,
      marks: qd.marks,
      required: qd.required,
      ...(qd.type === QUESTION_TYPES.MCQ
        ? { options: qd.options }
        : { correctAnswer: qd.correctAnswer }),
      publishedSnapshot:
        qd.type === QUESTION_TYPES.MCQ
          ? {
              kind: 'mcq',
              correctOptionIndex: qd.options.findIndex((o) => o.isCorrect),
              correctAnswer: null,
              marks: qd.marks,
              required: qd.required,
            }
          : {
              kind: 'truefalse',
              correctOptionIndex: null,
              correctAnswer: qd.correctAnswer,
              marks: qd.marks,
              required: qd.required,
            },
    });
    await question.save();
    questionDocs.push(question._id);
  }

  quiz.questionIds = questionDocs;
  quiz.totalMarks = DEMO_QUESTIONS.reduce((sum, q) => sum + q.marks, 0);
  await quiz.save();

  return quiz;
}

async function seedDemoQuizIfNeeded(teacherEmail) {
  const teacher = await User.findByEmailWithHash(teacherEmail);
  if (!teacher) {
    logger.warn('demo quiz skipped: teacher account not found', { email: teacherEmail });
    return null;
  }

  const existing = await Quiz.findOne({ title: DEMO_QUIZ.title, seedData: true }).lean();
  if (existing) {
    logger.info('demo quiz already seeded', { title: DEMO_QUIZ.title, quizId: existing._id });
    return existing;
  }

  const quiz = await seedDemoQuiz(teacher._id);
  logger.info('demo quiz seeded', {
    title: quiz.title,
    quizId: quiz._id,
    questionCount: quiz.questionIds.length,
    totalMarks: quiz.totalMarks,
  });
  return quiz;
}

async function run() {
  const force = process.argv.includes('--force');

  if (env.isProduction && !force) {
    logger.error('refusing to seed a production database (pass --force to override)');
    process.exitCode = 1;
    return;
  }

  await connectDatabase();
  const result = await seedDemoUsers();

  console.log('\nQuizSphere demo data (clearly identified: User.seedData = true)');
  console.log('─'.repeat(72));
  console.log(`${'Role'.padEnd(14)}${'Email'.padEnd(30)}Name`);
  console.log('─'.repeat(72));
  for (const demo of DEMO_USERS) {
    console.log(`${ROLE_LABELS[demo.role].padEnd(14)}${demo.email.padEnd(30)}${demo.name}`);
  }
  console.log('─'.repeat(72));
  console.log(`Password for every demo account: ${DEMO_PASSWORD}`);
  console.log(`Created: ${result.created.length}  Updated: ${result.updated.length}`);

  const demoQuiz = await seedDemoQuizIfNeeded('teacher@quizsphere.test');
  if (demoQuiz) {
    console.log('\nDemo quiz (clearly identified: Quiz.seedData = true)');
    console.log('─'.repeat(72));
    console.log(`Title: ${demoQuiz.title}`);
    console.log(`Duration: ${demoQuiz.durationSeconds}s  Passing: ${demoQuiz.passingPercentage}%  Total marks: ${demoQuiz.totalMarks}`);
    console.log(`Questions: ${demoQuiz.questionIds.length}  Quiz id: ${demoQuiz._id}`);
    console.log('─'.repeat(72));
  }

  console.log('\nThese accounts and the demo quiz are for local development only. Never seed a production database.\n');

  await disconnectDatabase();
}

if (require.main === module) {
  run().catch(async (error) => {
    logger.error('seed failed', { message: error.message });
    await disconnectDatabase().catch(() => {});
    process.exitCode = 1;
  });
}

module.exports = {
  DEMO_PASSWORD,
  DEMO_USERS,
  DEMO_QUIZ,
  DEMO_QUESTIONS,
  seedDemoUsers,
  seedDemoQuiz,
  seedDemoQuizIfNeeded,
};
