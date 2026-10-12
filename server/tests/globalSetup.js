'use strict';

const path = require('path');

/**
 * Boots a throwaway in-memory MongoDB for the whole test run and exposes its
 * URI to the workers through process.env.MONGO_URI.
 *
 * If the mongod binary cannot be downloaded/started, the URI is left unset and
 * database-dependent suites skip themselves (reported as skipped, never as
 * passing).
 */
module.exports = async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');

  try {
    const instance = await MongoMemoryServer.create({
      binary: {
        downloadDir: path.resolve(__dirname, '..', '.cache', 'mongodb-binaries'),
      },
    });

    global.__QUIZSPHERE_MONGOD__ = instance;
    process.env.MONGO_URI = instance.getUri('quizsphere_test');
    console.log(`\n[test] in-memory MongoDB ready: ${process.env.MONGO_URI}`);
  } catch (error) {
    delete process.env.MONGO_URI;
    process.env.MONGO_MEMORY_SERVER_FAILED = error.message;
    console.error(
      `\n[test] mongodb-memory-server could not start: ${error.message}\n` +
        '[test] Database-dependent suites will be SKIPPED (not reported as passing).\n',
    );
  }
};
