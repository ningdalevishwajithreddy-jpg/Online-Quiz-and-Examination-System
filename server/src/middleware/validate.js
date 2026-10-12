'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Zod validation middleware.
 *
 * Validated (and coerced) data replaces the raw input, so downstream code only
 * ever sees parsed values. Unknown keys are rejected by `.strict()` schemas,
 * which is how client supplied extras such as `role` or `score` are refused
 * instead of silently ignored.
 *
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'query'|'params'} [source]
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});

    if (!result.success) {
      const errors = result.error.issues.flatMap((issue) => {
        // Unknown keys carry the offending names separately, so report each one
        // against its own field instead of a single unnamed error.
        if (issue.code === 'unrecognized_keys' && Array.isArray(issue.keys) && issue.keys.length > 0) {
          return issue.keys.map((key) => ({ field: key, message: `Unrecognized key: "${key}"` }));
        }

        return [
          {
            field: issue.path.join('.') || (source === 'body' ? '_' : source),
            message: issue.message,
          },
        ];
      });
      return next(ApiError.validation(errors));
    }

    if (source === 'body') {
      req.body = result.data;
    } else {
      Object.defineProperty(req, source, {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    return next();
  };
}

module.exports = validate;
