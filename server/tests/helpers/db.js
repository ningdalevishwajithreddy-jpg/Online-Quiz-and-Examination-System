'use strict';

const mongoose = require('mongoose');

const { connectDatabase, disconnectDatabase } = require('../../src/config/db');

/** True when the in-memory MongoDB started successfully. */
const dbAvailable = () => Boolean(process.env.MONGO_URI);

/** Suite selector: real suite when Mongo is available, otherwise explicitly skipped. */
const describeIfDb = dbAvailable() ? describe : describe.skip;

async function connectTestDatabase() {
  if (!dbAvailable()) return null;
  return connectDatabase(process.env.MONGO_URI);
}

/** Removes every document between tests without dropping indexes. */
async function clearCollections() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
}

async function dropTestDatabase() {
  if (!dbAvailable()) return;
  await mongoose.connection.dropDatabase();
  await disconnectDatabase();
}

function databaseUnavailableReason() {
  if (dbAvailable()) return '';
  return `mongodb-memory-server unavailable: ${process.env.MONGO_MEMORY_SERVER_FAILED || 'unknown reason'}`;
}

module.exports = {
  clearCollections,
  connectTestDatabase,
  databaseUnavailableReason,
  dbAvailable,
  describeIfDb,
  dropTestDatabase,
};
