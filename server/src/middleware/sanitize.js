'use strict';

/**
 * NoSQL-injection guard.
 *
 * Removes keys that MongoDB treats as operators (`$gt`, `$where`, ...) or as
 * nested paths (`profile.role`) from request bodies, params and the query
 * object, recursively - the same protection express-mongo-sanitize provides.
 *
 * Implemented locally because express-mongo-sanitize assigns to `req.query`,
 * which Express 5 exposes as a prototype getter, so the package silently
 * fails to sanitise queries (and throws under some configurations).
 */

const FORBIDDEN_KEY_PREFIX = '$';

/**
 * Only true plain objects are rebuilt. Anything with another prototype (Date,
 * Buffer, Map, ObjectId, ...) is a legitimate value and must pass through
 * untouched - otherwise a Date in a request body would be replaced by {}.
 */
function isPlainObject(value) {
  if (typeof value !== 'object' || value === null) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function sanitizeValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeValue);

  if (isPlainObject(value)) {
    const clean = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key.startsWith(FORBIDDEN_KEY_PREFIX)) continue;
      if (key.includes('.')) continue;
      clean[key] = sanitizeValue(nested);
    }
    return clean;
  }

  return value;
}

/** Replaces a read-only property (Express 5 defines req.query via a getter). */
function redefine(target, property, value) {
  Object.defineProperty(target, property, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

function sanitizeRequest() {
  return (req, res, next) => {
    if (isPlainObject(req.body)) req.body = sanitizeValue(req.body);

    if (isPlainObject(req.params)) {
      const cleanParams = sanitizeValue(req.params);
      try {
        Object.assign(req.params, cleanParams);
      } catch {
        redefine(req, 'params', cleanParams);
      }
    }

    if (isPlainObject(req.query)) {
      const cleanQuery = sanitizeValue({ ...req.query });
      try {
        redefine(req, 'query', cleanQuery);
      } catch {
        /* Express <= 4 path: query is a plain writable property. */
        req.query = cleanQuery;
      }
    }

    next();
  };
}

module.exports = { sanitizeRequest, sanitizeValue };
