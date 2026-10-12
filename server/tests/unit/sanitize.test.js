'use strict';

const { sanitizeValue } = require('../../src/middleware/sanitize');

describe('sanitizeValue (NoSQL injection guard)', () => {
  test('strips MongoDB operator keys', () => {
    const input = { email: { $gt: '' }, $where: 'this.passwordHash != null' };
    expect(sanitizeValue(input)).toEqual({ email: {} });
  });

  test('strips dotted keys used for nested query injection', () => {
    expect(sanitizeValue({ 'profile.role': 'admin', name: 'Sara' })).toEqual({ name: 'Sara' });
  });

  test('sanitizes nested objects and arrays of objects', () => {
    const input = {
      answers: [
        { questionId: 'a1', selected: { $ne: null } },
        { questionId: 'a2', selected: 'B' },
      ],
      meta: { nested: { $where: 'x' }, keep: 1 },
    };
    expect(sanitizeValue(input)).toEqual({
      answers: [{ questionId: 'a1', selected: {} }, { questionId: 'a2', selected: 'B' }],
      meta: { nested: {}, keep: 1 },
    });
  });

  test('keeps legitimate scalars, dates and null untouched', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    expect(sanitizeValue({ a: 1, b: 'text', c: null, d: true, e: date })).toEqual({
      a: 1,
      b: 'text',
      c: null,
      d: true,
      e: date,
    });
  });
});
