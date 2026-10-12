'use strict';

const jwt = require('jsonwebtoken');

const env = require('../../src/config/env');
const {
  AUDIENCE,
  ISSUER,
  decodeAccessToken,
  signAccessToken,
  verifyAccessToken,
} = require('../../src/services/tokenService');

const fakeUser = {
  _id: '64b7f1c2a4d3e5f6a7b8c9d0',
  role: 'teacher',
  credentialVersion: () => 1700000000000,
};

describe('tokenService', () => {
  test('signs a verifiable token carrying sub, role and credential version', () => {
    const token = signAccessToken(fakeUser);
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe(fakeUser._id);
    expect(payload.role).toBe('teacher');
    expect(payload.pwdv).toBe(1700000000000);
    expect(payload.iss).toBe(ISSUER);
    expect(payload.aud).toBe(AUDIENCE);
  });

  test('rejects a tampered token', () => {
    const token = signAccessToken(fakeUser);
    const tampered = `${token.slice(0, -2)}xx`;
    expect(() => verifyAccessToken(tampered)).toThrow(jwt.JsonWebTokenError);
  });

  test('rejects a token signed with a different secret', () => {
    const foreign = jwt.sign({ sub: fakeUser._id }, 'a'.repeat(48), {
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresIn: '1h',
    });
    expect(() => verifyAccessToken(foreign)).toThrow(jwt.JsonWebTokenError);
  });

  test('rejects a token that expired beyond the clock tolerance', () => {
    const expired = jwt.sign(
      { sub: fakeUser._id, exp: Math.floor(Date.now() / 1000) - 120 },
      env.JWT_SECRET,
      { issuer: ISSUER, audience: AUDIENCE },
    );
    expect(() => verifyAccessToken(expired)).toThrow(jwt.TokenExpiredError);
  });

  test('tolerates a few seconds of clock skew (documented 5s window)', () => {
    const justExpired = jwt.sign(
      { sub: fakeUser._id, exp: Math.floor(Date.now() / 1000) - 2 },
      env.JWT_SECRET,
      { issuer: ISSUER, audience: AUDIENCE },
    );
    expect(() => verifyAccessToken(justExpired)).not.toThrow();
  });

  test('decodeAccessToken reads claims without verifying', () => {
    const decoded = decodeAccessToken(signAccessToken(fakeUser));
    expect(decoded.sub).toBe(fakeUser._id);
  });
});
