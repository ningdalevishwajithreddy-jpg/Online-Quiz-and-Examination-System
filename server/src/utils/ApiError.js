'use strict';

/**
 * Operational HTTP error.
 *
 * `expose` marks errors that are safe to show to an API client. Anything that
 * is not an ApiError (or is an ApiError created without expose) is reported as
 * a generic 500 so stack traces / driver messages never leak.
 */
class ApiError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.expose = options.expose !== false;
    this.code = options.code || undefined;
    /** Field level details, e.g. [{ field: 'email', message: 'Invalid email' }] */
    this.errors = options.errors || undefined;
    this.details = options.details;
    Error.captureStackTrace(this, ApiError);
  }

  static badRequest(message = 'Invalid request', options) {
    return new ApiError(400, message, options);
  }

  static unauthorized(message = 'Authentication required', options) {
    return new ApiError(401, message, options);
  }

  static forbidden(message = 'You do not have permission to perform this action', options) {
    return new ApiError(403, message, options);
  }

  static notFound(message = 'Resource not found', options) {
    return new ApiError(404, message, options);
  }

  static conflict(message = 'Resource conflict', options) {
    return new ApiError(409, message, options);
  }

  static unprocessable(message = 'Validation failed', options) {
    return new ApiError(422, message, options);
  }

  static tooManyRequests(message = 'Too many requests', options) {
    return new ApiError(429, message, options);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable', options) {
    return new ApiError(503, message, options);
  }

  static internal(message = 'Something went wrong', options) {
    return new ApiError(500, message, { ...options, expose: false });
  }

  /** Field level validation error used by the Zod validation middleware. */
  static validation(errors, message = 'Validation failed') {
    return new ApiError(422, message, { errors });
  }
}

module.exports = ApiError;
