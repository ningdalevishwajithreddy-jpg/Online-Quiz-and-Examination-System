'use strict';

const cron = require('node-cron');

const env = require('../config/env');
const logger = require('../utils/logger');
const User = require('../models/User');

/**
 * Background jobs.
 *
 * Every job is a plain exported function so it can be unit tested without
 * waiting for a cron tick. Jobs run in UTC and never throw into the scheduler.
 */

const JOBS = Object.freeze({
  RELEASE_EXPIRED_LOCKOUTS: 'release-expired-lockouts',
});

/**
 * Clears `lockUntil` / failed-attempt counters for accounts whose lock has
 * expired, so a locked-out user is never permanently blocked by stale state
 * (sign-in also releases the lock lazily on the next attempt).
 */
async function releaseExpiredLockouts() {
  const released = await User.releaseExpiredLockouts();
  if (released > 0) {
    logger.info('released expired account lockouts', { count: released });
  }
  return released;
}

const JOB_MAP = {
  [JOBS.RELEASE_EXPIRED_LOCKOUTS]: releaseExpiredLockouts,
};

let scheduledTask = null;

/** Starts the every-minute job that releases expired account lockouts. */
function startScheduler() {
  if (scheduledTask) return scheduledTask;
  // Tests never start timers - jest would otherwise never exit.
  if (env.isTest) return null;

  scheduledTask = cron.schedule(
    '* * * * *',
    async () => {
      try {
        await releaseExpiredLockouts();
      } catch (error) {
        logger.error('scheduled job failed', {
          job: JOBS.RELEASE_EXPIRED_LOCKOUTS,
          message: error.message,
        });
      }
    },
    { timezone: 'UTC' },
  );

  logger.info('scheduler started', { job: JOBS.RELEASE_EXPIRED_LOCKOUTS, schedule: 'every minute (UTC)' });
  return scheduledTask;
}

function stopScheduler() {
  if (!scheduledTask) return;
  if (typeof scheduledTask.destroy === 'function') scheduledTask.destroy();
  else scheduledTask.stop();
  scheduledTask = null;
  logger.info('scheduler stopped');
}

module.exports = { JOBS, JOB_MAP, releaseExpiredLockouts, startScheduler, stopScheduler };
