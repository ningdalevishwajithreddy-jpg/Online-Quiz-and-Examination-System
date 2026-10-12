'use strict';

const { z } = require('zod');

const validate = require('../../src/middleware/validate');
const { requireRole } = require('../../src/middleware/auth');
const { mapKnownError } = require('../../src/middleware/errorHandler');
const ApiError = require('../../src/utils/ApiError');
const { passwordSchema, registerSchema } = require('../../src/validators/auth.validator');

const runMiddleware = (middleware, req) =>
  new Promise((resolve) => {
    middleware(req, {}, (error) => resolve(error));
  });

describe('validate middleware', () => {
  test('passes parsed data through and replaces the raw body', async () => {
    const req = {
      body: { name: '  Sara Iqbal ', email: 'SARA@Example.com', password: 'Passw0rd123' },
    };
    const error = await runMiddleware(validate(registerSchema), req);

    expect(error).toBeUndefined();
    expect(req.body.name).toBe('Sara Iqbal');
    expect(req.body.email).toBe('SARA@Example.com');
    expect(req.body.password).toBe('Passw0rd123');
  });

  test('rejects unknown keys such as a smuggled role', async () => {
    const req = {
      body: { name: 'Sara', email: 'sara@example.com', password: 'Passw0rd123', role: 'admin' },
    };
    const error = await runMiddleware(validate(registerSchema), req);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.statusCode).toBe(422);
    expect(error.errors.some((issue) => issue.message.includes('Unrecognized key'))).toBe(true);
  });

  test('reports field level errors for invalid input', async () => {
    const req = { body: { name: 'S', email: 'not-an-email', password: 'short' } };
    const error = await runMiddleware(validate(registerSchema), req);

    expect(error.statusCode).toBe(422);
    const fields = error.errors.map((issue) => issue.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });
});

describe('password policy', () => {
  test.each([
    ['short1', 'at least 8 characters'],
    ['onlyletters', 'at least one number'],
    ['12345678', 'at least one letter'],
  ])('rejects %s', (candidate, expectedMessage) => {
    const result = passwordSchema.safeParse(candidate);
    expect(result.success).toBe(false);
    expect(result.error.issues.some((issue) => issue.message.includes(expectedMessage))).toBe(true);
  });

  test('accepts a password with letters and numbers of sufficient length', () => {
    expect(passwordSchema.safeParse('QuizSphere2026').success).toBe(true);
  });
});

describe('requireRole', () => {
  const makeReq = (role) => ({ user: role ? { role } : undefined });

  test('allows a permitted role', () => {
    const req = makeReq('teacher');
    let called = false;
    requireRole('admin', 'teacher')(req, {}, () => {
      called = true;
    });
    expect(called).toBe(true);
  });

  test('rejects a forbidden role with 403', () => {
    let captured;
    requireRole('admin')(makeReq('student'), {}, (error) => {
      captured = error;
    });
    expect(captured).toBeInstanceOf(ApiError);
    expect(captured.statusCode).toBe(403);
  });

  test('rejects an unauthenticated request with 401', () => {
    let captured;
    requireRole('admin')(makeReq(undefined), {}, (e) => {
      captured = e;
    });
    expect(captured.statusCode).toBe(401);
  });

  test('refuses to be constructed without valid roles', () => {
    expect(() => requireRole('superuser')).toThrow(/without valid roles/);
  });
});

describe('error mapping', () => {
  test('maps duplicate key errors to 409', () => {
    const mapped = mapKnownError({ code: 11000, keyPattern: { email: 1 } });
    expect(mapped.statusCode).toBe(409);
    expect(mapped.message).toContain('email');
  });

  test('maps mongoose validation errors to 422 with field details', () => {
    const mapped = mapKnownError({
      name: 'ValidationError',
      errors: { email: { path: 'email', message: 'Email is not valid' } },
    });
    expect(mapped.statusCode).toBe(422);
    expect(mapped.errors).toEqual([{ field: 'email', message: 'Email is not valid' }]);
  });

  test('maps malformed JSON bodies to 400', () => {
    expect(mapKnownError({ type: 'entity.parse.failed' }).statusCode).toBe(400);
  });

  test('maps invalid ObjectId casts to 400', () => {
    expect(mapKnownError({ name: 'CastError', path: 'id' }).statusCode).toBe(400);
  });

  test('hides unexpected internal errors', () => {
    const mapped = mapKnownError(new Error('driver exploded'));
    expect(mapped.statusCode).toBe(500);
    expect(mapped.expose).toBe(false);
    expect(mapped.message).not.toContain('driver exploded');
  });

  test('maps JWT errors to 401', () => {
    expect(mapKnownError({ name: 'TokenExpiredError' }).statusCode).toBe(401);
  });

  test('maps a ZodError thrown outside the validate middleware to 422', () => {
    const zodError = (() => {
      try {
        z.strictObject({ a: z.string() }).parse({ b: 1 });
      } catch (error) {
        return error;
      }
      return null;
    })();
    expect(mapKnownError(zodError).statusCode).toBe(422);
  });
});
