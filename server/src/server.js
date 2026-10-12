'use strict';

const env = require('./config/env');
const logger = require('./utils/logger');
const { createApp } = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/db');
const { startScheduler, stopScheduler } = require('./jobs/scheduler');

/**
 * Process entry point.
 *
 * Startup is deliberately resilient: if MongoDB is unreachable the API still
 * listens (so /api/health reports `degraded` and the client shows a clear
 * message) instead of crash-looping. Mongoose keeps retrying in the background.
 */
async function start() {
  const app = createApp();

  try {
    await connectDatabase();
  } catch (error) {
    logger.error('initial MongoDB connection failed - starting in degraded mode', {
      message: error.message,
      hint: 'Is mongod running, or is MONGO_URI pointing at your Atlas cluster?',
    });
  }

  const server = app.listen(env.PORT, () => {
    logger.info('QuizSphere API listening', {
      url: `http://localhost:${env.PORT}`,
      environment: env.NODE_ENV,
      allowedOrigins: env.clientOrigins.join(', '),
      emailProvider: env.emailEnabled ? 'configured' : 'not configured',
    });
  });

  // Don't hold the process open on idle keep-alive sockets forever.
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  const scheduler = startScheduler();

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`received ${signal} - shutting down`);

    const forceExit = setTimeout(() => {
      logger.error('graceful shutdown timed out - forcing exit');
      process.exit(1);
    }, 10000);
    forceExit.unref();

    stopScheduler();
    await new Promise((resolve) => server.close(resolve));
    await disconnectDatabase().catch(() => {});
    clearTimeout(forceExit);
    logger.info('shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled promise rejection', {
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('uncaught exception - shutting down', { message: error.message, stack: error.stack });
    void shutdown('uncaughtException');
  });

  return { app, server, scheduler };
}

if (require.main === module) {
  start();
}

module.exports = { start };
