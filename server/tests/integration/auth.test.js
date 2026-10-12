'use strict';

const request = require('supertest');

const { createApp } = require('../../src/app');
const AuditLog = require('../../src/models/AuditLog');
const User = require('../../src/models/User');
const { ROLE_VALUES } = require('../../src/config/constants');
const { releaseExpiredLockouts } = require('../../src/jobs/scheduler');
const { createTestClient, cookieValue, isCookieCleared } = require('../helpers/testClient');
const { clearCollections, connectTestDatabase, describeIfDb, dropTestDatabase } = require('../helpers/db');

const app = createApp();

const VALID_USER = {
  name: 'Sara Iqbal',
  email: 'sara@example.com',
  password: 'Passw0rd123',
};

beforeAll(async () => {
  await connectTestDatabase();
  await User.init();
});

beforeEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await dropTestDatabase();
});

describeIfDb('POST /api/auth/register', () => {
  test('creates a student, starts a session and never returns the hash', async () => {
    const client = await createTestClient(app);
    const response = await client.post('/api/auth/register').send(VALID_USER);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toMatchObject({
      name: 'Sara Iqbal',
      email: 'sara@example.com',
      role: 'student',
      status: 'active',
    });
    expect(response.body.data.user.id).toMatch(/^[a-f0-9]{24}$/);
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|\$2[aby]\$/);

    const authCookie = (response.headers['set-cookie'] || []).find((entry) => entry.startsWith('qs_token='));
    expect(authCookie).toBeDefined();
    expect(authCookie).toMatch(/HttpOnly/i);
    expect(authCookie).toMatch(/SameSite=Lax/i);
  });

  test('stores a bcrypt hash with cost 12 and a normalised email', async () => {
    const client = await createTestClient(app);
    await client.post('/api/auth/register').send({ ...VALID_USER, email: '  SARA@Example.COM ' });

    const stored = await User.findByEmailWithHash('sara@example.com');
    expect(stored).not.toBeNull();
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(await stored.verifyPassword(VALID_USER.password)).toBe(true);
  });

  test('refuses a client supplied role', async () => {
    const client = await createTestClient(app);
    const response = await client.post('/api/auth/register').send({ ...VALID_USER, role: 'admin' });

    expect(response.status).toBe(422);
    expect(response.body.errors.some((issue) => issue.message.includes('Unrecognized key'))).toBe(true);

    const created = await User.findOne({ email: VALID_USER.email });
    expect(created).toBeNull();
  });

  test('enforces the password policy', async () => {
    const client = await createTestClient(app);
    const response = await client.post('/api/auth/register').send({ ...VALID_USER, password: 'onlyletters' });

    expect(response.status).toBe(422);
    expect(response.body.errors).toContainEqual({
      field: 'password',
      message: expect.stringMatching(/number/),
    });
  });

  test('rejects a duplicate email with 409', async () => {
    const client = await createTestClient(app);
    await client.post('/api/auth/register').send(VALID_USER);
    const response = await client.post('/api/auth/register').send(VALID_USER);

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  test('records an audit entry', async () => {
    const client = await createTestClient(app);
    await client.post('/api/auth/register').send(VALID_USER);

    const entry = await AuditLog.findOne({ action: 'auth.register' });
    expect(entry).not.toBeNull();
    expect(entry.actorRole).toBe('student');
  });
});

describeIfDb('POST /api/auth/login', () => {
  beforeEach(async () => {
    const client = await createTestClient(app);
    await client.post('/api/auth/register').send(VALID_USER);
  });

  test('signs in with correct credentials', async () => {
    const client = await createTestClient(app);
    const response = await client.post('/api/auth/login').send({
      email: VALID_USER.email,
      password: VALID_USER.password,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(VALID_USER.email);
    expect(await AuditLog.countDocuments({ action: 'auth.login_succeeded' })).toBe(1);
  });

  test('returns a generic error for a wrong password', async () => {
    const client = await createTestClient(app);
    const response = await client.post('/api/auth/login').send({
      email: VALID_USER.email,
      password: 'WrongPass123',
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email or password');
  });

  test('returns the identical generic error for an unknown account', async () => {
    const client = await createTestClient(app);
    const response = await client.post('/api/auth/login').send({
      email: 'ghost@example.com',
      password: 'WrongPass123',
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid email or password');
    expect(await AuditLog.countDocuments({ action: 'auth.login_failed' })).toBe(1);
  });

  test('locks the account after the configured number of failures', async () => {
    const client = await createTestClient(app);
    const badAttempt = () =>
      client.post('/api/auth/login').send({ email: VALID_USER.email, password: 'WrongPass123' });

    expect((await badAttempt()).status).toBe(401);
    expect((await badAttempt()).status).toBe(401);
    expect((await badAttempt()).status).toBe(401);

    const locked = await badAttempt();
    expect(locked.status).toBe(429);
    expect(locked.body.message).toMatch(/temporarily locked/i);

    // Even the correct password is refused while locked.
    const withCorrectPassword = await client.post('/api/auth/login').send({
      email: VALID_USER.email,
      password: VALID_USER.password,
    });
    expect(withCorrectPassword.status).toBe(429);

    const stored = await User.findByEmailWithHash(VALID_USER.email);
    expect(stored.lockUntil).toBeInstanceOf(Date);
  });

  test('the cron job releases an expired lock and the user can sign in again', async () => {
    const stored = await User.findByEmailWithHash(VALID_USER.email);
    stored.lockUntil = new Date(Date.now() - 60 * 1000);
    await stored.save();

    const released = await releaseExpiredLockouts();
    expect(released).toBe(1);

    const client = await createTestClient(app);
    const response = await client.post('/api/auth/login').send({
      email: VALID_USER.email,
      password: VALID_USER.password,
    });
    expect(response.status).toBe(200);
  });

  test('refuses a suspended account but only after the password is correct', async () => {
    await User.updateOne({ email: VALID_USER.email }, { $set: { status: 'suspended' } });

    const client = await createTestClient(app);
    const wrongPassword = await client.post('/api/auth/login').send({
      email: VALID_USER.email,
      password: 'WrongPass123',
    });
    expect(wrongPassword.status).toBe(401);

    const correctPassword = await client.post('/api/auth/login').send({
      email: VALID_USER.email,
      password: VALID_USER.password,
    });
    expect(correctPassword.status).toBe(403);
    expect(correctPassword.body.message).toMatch(/not available/i);
  });
});

describeIfDb('session endpoints', () => {
  let client;

  beforeEach(async () => {
    client = await createTestClient(app);
    await client.post('/api/auth/register').send(VALID_USER);
  });

  test('GET /api/auth/me requires authentication', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('GET /api/auth/me returns the signed-in profile', async () => {
    const response = await client.get('/api/auth/me');

    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe(VALID_USER.email);
    expect(response.body.data.roleLabel).toBe('Student');
    expect(response.body.data.user.role).toBe('student');
    expect(ROLE_VALUES).toContain(response.body.data.user.role);
    expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|failedLoginAttempts|lockUntil/);
  });

  test('an invalid token is rejected', async () => {
    const response = await request(app).get('/api/auth/me').set('Cookie', ['qs_token=not.a.jwt']);
    expect(response.status).toBe(401);
  });

  test('logout clears the cookie and ends the session', async () => {
    const logoutResponse = await client.post('/api/auth/logout').send({});
    expect(logoutResponse.status).toBe(200);
    expect(isCookieCleared(logoutResponse, 'qs_token')).toBe(true);

    const me = await client.get('/api/auth/me');
    expect(me.status).toBe(401);
  });
});

describeIfDb('PATCH /api/auth/profile', () => {
  test('updates the display name', async () => {
    const client = await createTestClient(app);
    await client.post('/api/auth/register').send(VALID_USER);

    const response = await client.patch('/api/auth/profile').send({ name: 'Sara A. Iqbal' });
    expect(response.status).toBe(200);
    expect(response.body.data.user.name).toBe('Sara A. Iqbal');

    const stored = await User.findOne({ email: VALID_USER.email });
    expect(stored.name).toBe('Sara A. Iqbal');
  });

  test('refuses self-service email or role changes', async () => {
    const client = await createTestClient(app);
    await client.post('/api/auth/register').send(VALID_USER);

    const emailChange = await client
      .patch('/api/auth/profile')
      .send({ name: 'Sara', email: 'other@example.com' });
    expect(emailChange.status).toBe(422);

    const roleChange = await client.patch('/api/auth/profile').send({ name: 'Sara', role: 'admin' });
    expect(roleChange.status).toBe(422);
  });

  test('requires authentication (with a valid CSRF token)', async () => {
    const anonymousClient = await createTestClient(app);
    const response = await anonymousClient.patch('/api/auth/profile').send({ name: 'Nobody' });
    expect(response.status).toBe(401);
  });

  test('rejects a request with neither a session nor a CSRF token', async () => {
    // CSRF is validated before authentication, so this is a 403, not a 401.
    const response = await request(app).patch('/api/auth/profile').send({ name: 'Nobody' });
    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/CSRF/i);
  });
});

describeIfDb('PATCH /api/auth/password', () => {
  test('rejects a wrong current password', async () => {
    const client = await createTestClient(app);
    await client.post('/api/auth/register').send(VALID_USER);

    const response = await client
      .patch('/api/auth/password')
      .send({ currentPassword: 'WrongPass123', newPassword: 'BrandNew123' });

    expect(response.status).toBe(401);
  });

  test('rejects reusing the same password', async () => {
    const client = await createTestClient(app);
    await client.post('/api/auth/register').send(VALID_USER);

    const response = await client
      .patch('/api/auth/password')
      .send({ currentPassword: VALID_USER.password, newPassword: VALID_USER.password });

    expect(response.status).toBe(422);
  });

  test('changes the password, invalidates old tokens and keeps the current session', async () => {
    const registerClient = await createTestClient(app);
    const registerResponse = await registerClient
      .post('/api/auth/register')
      .send(VALID_USER);
    const oldToken = cookieValue(registerResponse, 'qs_token');

    const response = await registerClient
      .patch('/api/auth/password')
      .send({ currentPassword: VALID_USER.password, newPassword: 'BrandNew123' });

    expect(response.status).toBe(200);
    expect(cookieValue(response, 'qs_token')).not.toBe(oldToken);

    // The pre-change token is dead ...
    const withOldToken = await request(app).get('/api/auth/me').set('Cookie', [`qs_token=${oldToken}`]);
    expect(withOldToken.status).toBe(401);

    // ... the refreshed session keeps working ...
    expect((await registerClient.get('/api/auth/me')).status).toBe(200);

    // ... and the new password signs in from a clean client.
    const freshClient = await createTestClient(app);
    const relogin = await freshClient
      .post('/api/auth/login')
      .send({ email: VALID_USER.email, password: 'BrandNew123' });
    expect(relogin.status).toBe(200);

    expect(await AuditLog.countDocuments({ action: 'auth.password_changed' })).toBe(1);
  });
});
