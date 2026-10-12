'use strict';

/**
 * Wraps an async route handler so a rejected promise reaches the centralized
 * error handler. Express 5 already forwards rejections, but being explicit
 * keeps the contract obvious and protects against future misuse.
 */
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = asyncHandler;
