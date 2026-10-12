'use strict';

const os = require('os');

const mongoose = require('mongoose');

const env = require('./env');
const logger = require('../utils/logger');

/**
 * Single place that owns the Mongoose connection state.
 *
 * The app deliberately does *not* exit when MongoDB is unreachable: the API
 * keeps serving /api/health with a `degraded` status so operators can see the
 * problem, and mongoose retries in the background. Reads/writes fail with a
 * clear 503 instead of a 500.
 */

const READY_STATES = Object.freeze({
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
});

let listenersRegistered = false;

function registerConnectionListeners() {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('error', (error) => {
    logger.error('mongodb connection error', { message: error.message });
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('mongodb disconnected');
  });
  mongoose.connection.on('reconnected', () => {
    logger.info('mongodb reconnected');
  });
}

async function connectDatabase(uri = env.MONGO_URI) {
  registerConnectionListeners();
  mongoose.set('strictQuery', true);
  // Schema indexes are ensured outside production; production runs migrations.
  mongoose.set('autoIndex', !env.isProduction);

  await mongoose.connect(uri, {
    maxPoolSize: env.MONGO_MAX_POOL_SIZE,
    serverSelectionTimeoutMS: env.MONGO_SERVER_SELECTION_TIMEOUT_MS,
    // Required workaround for MongoDB driver >= 7.6.0 (NODE-7832): the driver
    // resolves its default OS adapter with a dynamic import('os'), which fails
    // in any runtime that has `require` but no dynamic-import callback (Jest's
    // node environment, several VM/serverless sandboxes). The handshake then
    // omits the required client metadata and MongoDB replies with the
    // misleading "Missing required sub-document 'driver' in the client metadata
    // document", failing every connection. Passing the adapter explicitly is
    // the workaround documented by the driver team.
    runtimeAdapters: { os },
  });

  const { name, host, port } = mongoose.connection;
  logger.info('mongodb connected', { database: name, host: `${host}:${port}` });
  return mongoose.connection;
}

async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.connection.close(false);
  logger.info('mongodb connection closed');
}

/** Plain, serialisable snapshot of the connection for health reporting. */
function getDatabaseState() {
  const state = mongoose.connection.readyState;
  return {
    status: READY_STATES[state] || 'unknown',
    connected: state === 1,
    name: mongoose.connection.name || null,
  };
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getDatabaseState,
};
