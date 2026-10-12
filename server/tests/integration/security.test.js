'use strict';

const request = require('supertest');

const { createApp } = require('../../src/app');
const { createTestClient } = require('../helpers/testClient');
const { connectTestDatabase, dropTestDatabase } = require('../helpers/db');

const app = createApp();

beforeAll(async () => {
  await connectTestDatabase();
});

afterAll(async () => {
  await dropTestDatabase();
});

describe('CSRF protection', () => {
  test('issues a readable (non-httpOnly) CSRF cookie and returns the token', async () => {
    const response = await request(app).get('/api/auth/csrf');

    expect(response.status).toBe(200);
    expect(response.body.data.csrfToken).toMatch(/^[a-f0-9]{64}$/);
    expect(response.body.data.headerName).toBe('x-csrf-token');

    const cookie = (response.headers['set-cookie'] || []).find((entry) => entry.startsWith('qs_csrf='));
    expect(cookie).toBeDefined();
    expect(cookie).not.toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  test('rejects an unsafe request without a CSRF token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@example.com', password: 'Passw0rd123' });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/CSRF/i);
  });

  test('rejects a mismatched CSRF token', async () => {
    const client = await createTestClient(app);
    const response = await client
      .post('/api/auth/login')
      .set('x-csrf-token', 'f'.repeat(64))
      .send({ email: 'student@example.com', password: 'Passw0rd123' });

    expect(response.status).toBe(403);
  });

  test('accepts a matching CSRF token (request reaches the controller)', async () => {
    const client = await createTestClient(app);
    const response = await client.post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'Passw0rd123',
    });

    // Not a CSRF rejection any more: the credentials are simply wrong.
    expect(response.status).toBe(401);
  });

  test('rejects an unsafe request from a foreign origin', async () => {
    const client = await createTestClient(app);
    const response = await client
      .post('/api/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: 'student@example.com', password: 'Passw0rd123' });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/origin/i);
  });

  test('safe methods do not require a CSRF token', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  });
});

describe('CORS', () => {
  test('allows the configured client origin with credentials', async () => {
    const response = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  test('rejects an unknown origin', async () => {
    const response = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });
});

describe('NoSQL injection guard (end to end)', () => {
  test('operator payloads never reach the query layer', async () => {
    const client = await createTestClient(app);
    const response = await client.post('/api/auth/login').send({
      email: { $gt: '' },
      password: { $ne: null },
    });

    // Stripped to {} -> schema validation fails cleanly (422), not a 500.
    expect(response.status).toBe(422);
    expect(response.body.errors.map((issue) => issue.field)).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
  });

  test('dotted path keys are stripped before validation, so they cannot escalate', async () => {
    const client = await createTestClient(app);
    const response = await client.post('/api/auth/login').send({
      email: 'student@example.com',
      password: 'Passw0rd123',
      'account.role': 'admin',
    });

    // The sanitizer removes the planted key, so the payload is *well formed*
    // and reaches the normal credential check - a generic 401, never an
    // authentication bypass and never a 500.
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email or password');
  });
});

describe('rate limiting', () => {
  test('throttles repeated credential attempts with 429', async () => {
    const limitedApp = createApp({ rateLimits: { authMax: 2, windowMinutes: 1 } });
    const client = await createTestClient(limitedApp);

    const attempt = () =>
      client.post('/api/auth/login').send({ email: 'none@example.com', password: 'Passw0rd123' });

    const first = await attempt();
    const second = await attempt();
    const third = await attempt();

    expect(first.status).toBe(401);
    expect(second.status).toBe(401);
    expect(third.status).toBe(429);
    expect(third.body.success).toBe(false);
    expect(third.body.message).toMatch(/too many/i);
    expect(third.headers['ratelimit-policy'] || third.headers['ratelimit']).toBeDefined();
  });
});

describe('malformed input', () => {
  test('invalid JSON returns 400 instead of crashing', async () => {
    const client = await createTestClient(app);
    const response = await client
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/not valid JSON/i);
  });
});
