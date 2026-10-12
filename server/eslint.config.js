'use strict';

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: ['node_modules/**', 'coverage/**', 'dist/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...(globals.jest || {}),
      },
    },
    rules: {
      'no-console': ['error', { allow: ['error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
    },
  },
  {
    // jest.config.js and this config file run in the Node CJS context.
    files: ['eslint.config.js', 'jest.config.js'],
    languageOptions: { sourceType: 'commonjs' },
  },
  {
    // The logger is the console sink, the seed script is a CLI and the test
    // harness reports through the console.
    files: ['src/utils/logger.js', 'src/seed/**/*.js', 'tests/**/*.js'],
    rules: { 'no-console': 'off' },
  },
];
