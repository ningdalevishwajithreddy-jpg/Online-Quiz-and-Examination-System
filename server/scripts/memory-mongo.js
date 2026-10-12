'use strict';

/**
 * Development helper: runs a throwaway MongoDB on a fixed port so the API can
 * be started on a machine with no mongod installed and no Atlas cluster.
 *
 *   node scripts/memory-mongo.js            # port 27099, data in a temp dir
 *   MONGO_MEMORY_PORT=27017 node scripts/memory-mongo.js
 *
 * Then point MONGO_URI at mongodb://127.0.0.1:27099/quizsphere.
 * Data lives only as long as this process; it is NOT for production, and it is
 * intentionally excluded from the default `npm run dev` flow.
 */

const path = require('path');

const { MongoMemoryServer } = require('mongodb-memory-server');

const port = Number(process.env.MONGO_MEMORY_PORT || 27099);
const dbName = process.env.MONGO_MEMORY_DB || 'quizsphere';

async function main() {
  const server = await MongoMemoryServer.create({
    binary: { downloadDir: path.resolve(__dirname, '..', '.cache', 'mongodb-binaries') },
    instance: { port, dbName },
  });

  const uri = server.getUri(dbName);

  /* eslint-disable no-console -- this is a CLI helper */
  console.log('QuizSphere development MongoDB (in-memory, discarded on exit)');
  console.log('─'.repeat(64));
  console.log(`URI  ${uri}`);
  console.log(`Then set MONGO_URI=${uri} in server/.env`);
  console.log('Press Ctrl+C to stop. Data is not persisted.');
  console.log('─'.repeat(64));
  /* eslint-enable no-console */

  const shutdown = async () => {
    await server.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Failed to start the in-memory MongoDB:', error.message);
  process.exitCode = 1;
});
