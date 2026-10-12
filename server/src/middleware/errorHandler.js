'use strict';

const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/** 404 for unmatched routes, funnelled into the central error handler. */
function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist`));
}

/**
 * Translates framework/driver failures into the API's error envelope without
 * leaking internals.
 */
function mapKnownError(error) {
  if (error instanceof ApiError) return error;

  // Malformed JSON body
  if (error.type === 'entity.parse.failed') {
    return ApiError.badRequest('Request body is not valid JSON');
  }
  // Body larger than the configured limit
  if (error.type === 'entity.too.large') {
    return new ApiError(413, 'Request body is too large');
  }

  // Mongoose schema validation
  if (error.name === 'ValidationError' && error.errors) {
    const errors = Object.values(error.errors).map((detail) => ({
      field: detail.path,
      message: detail.message,
    }));
    return ApiError.validation(errors);
  }

  // Unique index violation
  if (error.code === 11000) {
    const fields = Object.keys(error.keyPattern || error.keyValue || {});
    return ApiError.conflict(
      fields.length > 0
        ? `A record with this ${fields.join(', ')} already exists`
        : 'A record with these details already exists',
    );
  }

  // Invalid ObjectId / type cast
  if (error.name === 'CastError') {
    return ApiError.badRequest(`Invalid value for "${error.path}"`);
  }

  // A Zod schema parsed outside of the validate() middleware
  if (error.name === 'ZodError' && Array.isArray(error.issues)) {
    return ApiError.validation(
      error.issues.map((issue) => ({ field: issue.path.join('.') || '_', message: issue.message })),
    );
  }

  // jsonwebtoken failures
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Your session has expired. Please sign in again.');
  }

  // express-rate-limit and http-errors style errors
  if (typeof error.statusCode === 'number' && error.statusCode < 500) {
    return new ApiError(error.statusCode, error.message || 'Request rejected', { expose: true });
  }
  if (typeof error.status === 'number' && error.status < 500) {
    return new ApiError(error.status, error.message || 'Request rejected', { expose: true });
  }

  if (error.name === 'MongoServerSelectionError' || error.name === 'MongooseServerSelectionError') {
    return ApiError.serviceUnavailable('The database is unreachable. Please try again in a moment.');
  }

  return ApiError.internal();
}

// eslint-disable-next-line no-unused-vars -- Express requires the 4-arg signature
function errorHandler(error, req, res, next) {
  const normalised = mapKnownError(error);
  const status = normalised.statusCode || 500;

  const payload = { success: false, message: normalised.message };
  if (normalised.errors) payload.errors = normalised.errors;
  if (normalised.code) payload.code = normalised.code;

  const logMeta = {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    status,
    error: error.name || 'Error',
  };

  if (status >= 500) {
    logger.error(error.message || 'unhandled error', { ...logMeta, stack: error.stack });
  } else {
    logger.warn(normalised.message, logMeta);
  }

  // Only expose internals in development, and never in production.
  if (status >= 500 && !normalised.expose && !env.isProduction) {
    payload.debug = { name: error.name, message: error.message };
  }

  if (res.headersSent) return;
  res.status(status).json(payload);
}

module.exports = { errorHandler, notFoundHandler, mapKnownError };
