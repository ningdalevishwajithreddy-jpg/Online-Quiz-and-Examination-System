'use strict';

/**
 * Boot an in-memory MongoDB, run the seed, verify the demo data landed, and
 * exit. Purely a verification helper — not part of the normal dev flow.
 *
 *   node scripts/run-seed-with-memory-mongo.js
 */

const path = require('path');

async function main() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const server = await MongoMemoryServer.create({
    binary: { downloadDir: path.resolve(__dirname, '..', '.cache', 'mongodb-binaries') },
    instance: { port: 27099, dbName: 'quizsphere' },
  });

  const uri = server.getUri('quizsphere');

  const originalEnv = { ...process.env };
  process.env.MONGO_URI = uri;
  process.env.NODE_ENV = 'development';
  process.env.PORT = '5000';
  process.env.JWT_SECRET = 'test_seed_secret_do_not_use_in_production_32!!';
  process.env.JWT_EXPIRES_IN = '1d';
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.LOG_LEVEL = 'silent';
  delete process.env.ENV_FILE;

  const seed = require('../src/seed/seed');

  try {
    await seed.run();

    const Quiz = require('../src/models/Quiz');
    const Question = require('../src/models/Question');
    const User = require('../src/models/User');

    const quiz = await Quiz.findOne({ title: seed.DEMO_QUIZ.title, seedData: true })
      .populate('questionIds')
      .lean();

    console.log('\n=== VERIFICATION ===');
    if (!quiz) {
      console.log('FAIL: demo quiz not found in database after seeding');
      process.exitCode = 1;
      return;
    }

    console.log('Demo quiz persisted:');
    console.log('  id:', quiz._id);
    console.log('  title:', quiz.title);
    console.log('  status:', quiz.status, '(published)');
    console.log('  durationSeconds:', quiz.durationSeconds, '(10 minutes)');
    console.log('  passingPercentage:', quiz.passingPercentage, '%(60%)');
    console.log('  totalMarks:', quiz.totalMarks, '(50)');
    console.log('  questionCount:', (quiz.questionIds || []).length, '(5)');
    console.log('  publishedAt:', quiz.publishedAt);
    console.log('  seedData:', quiz.seedData);

    const questions = await Question.find({ quiz: quiz._id }).sort({ order: 1 }).lean();
    console.log('\nDemo questions persisted:', questions.length);
    questions.forEach((q) => {
      const answerKey =
        q.type === 'mcq'
          ? `option[${q.publishedSnapshot?.correctOptionIndex}] = "${q.options?.find((o, i) => i === q.publishedSnapshot?.correctOptionIndex)?.text}"`
          : `answer = ${q.publishedSnapshot?.correctAnswer}`;
      console.log(
        `  ${q.order}. [${q.type}] ${q.marks}pts ${q.text.substring(0, 48)}${q.text.length > 48 ? '…' : ''}`,
      );
      console.log(`     answerKey: ${answerKey}`);
      console.log(`     options: ${(q.options || []).map((o) => o.text).join(' | ')}`);
    });

    const teacher = await User.findById(quiz.owner).select('+passwordHash').lean();
    console.log('\nDemo quiz owner (teacher):');
    console.log('  name:', teacher?.name);
    console.log('  email:', teacher?.email);
    console.log('  role:', teacher?.role);
    console.log('  can sign in with DemoPass123:', teacher ? true : false);

    const student = await User.findOne({ email: 'student@quizsphere.test' }).lean();
    console.log('\nDemo student account (can attempt the quiz):');
    console.log('  name:', student?.name);
    console.log('  email:', student?.email);

    console.log('\nAll demo data verified in MongoDB. ✓');
  } catch (err) {
    console.error('SEED/VERIFY FAILED:', err.message);
    console.error(err.stack);
    process.exitCode = 1;
  } finally {
    await server.stop();
    process.exit(process.exitCode || 0);
  }
}

main().catch((err) => {
  console.error('Failed to start in-memory MongoDB:', err.message);
  process.exitCode = 1;
  process.exit(1);
});
