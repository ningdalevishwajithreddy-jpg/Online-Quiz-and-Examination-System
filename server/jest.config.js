'use strict';

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  // Starts a throwaway mongod (mongodb-memory-server) so the integration suite
  // never touches a real database.
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  setupFilesAfterEnv: ['<rootDir>/tests/setupEnv.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/seed/**'],
  clearMocks: true,
  verbose: true,
  testTimeout: 60000,
  // mongodb-memory-server is stateful: run test files sequentially.
  maxWorkers: 1,
};
