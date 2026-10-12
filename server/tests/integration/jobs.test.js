'use strict';

const User = require('../../src/models/User');
const { JOBS, JOB_MAP, releaseExpiredLockouts } = require('../../src/jobs/scheduler');
const { clearCollections, connectTestDatabase, describeIfDb, dropTestDatabase } = require('../helpers/db');

beforeAll(async () => {
  await connectTestDatabase();
});

beforeEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await dropTestDatabase();
});

const makeUser = async (email, { lockUntil = null, failedLoginAttempts = 0 } = {}) => {
  const user = new User({ name: 'Lock Test', email, role: 'student', lockUntil, failedLoginAttempts });
  await user.setPassword('Passw0rd123');
  await user.save();
  return user;
};

describeIfDb('scheduled job: release-expired-lockouts', () => {
  test('is registered in the job map', () => {
    expect(JOBS.RELEASE_EXPIRED_LOCKOUTS).toBe('release-expired-lockouts');
    expect(typeof JOB_MAP[JOBS.RELEASE_EXPIRED_LOCKOUTS]).toBe('function');
  });

  test('clears an expired lock and resets the failure counter', async () => {
    const user = await makeUser('expired@example.com', {
      lockUntil: new Date(Date.now() - 5000),
      failedLoginAttempts: 4,
    });

    const released = await releaseExpiredLockouts();
    expect(released).toBe(1);

    const reloaded = await User.findById(user._id);
    expect(reloaded.lockUntil).toBeNull();
    expect(reloaded.failedLoginAttempts).toBe(0);
  });

  test('leaves an active lock untouched', async () => {
    const user = await makeUser('active-lock@example.com', {
      lockUntil: new Date(Date.now() + 10 * 60 * 1000),
      failedLoginAttempts: 0,
    });

    const released = await releaseExpiredLockouts();
    expect(released).toBe(0);

    const reloaded = await User.findById(user._id);
    expect(reloaded.lockUntil).not.toBeNull();
  });
});
