'use strict';

const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Audit recording must never break a request: a logging failure is reported
 * but swallowed, because the user's action already succeeded.
 */
async function record({ action, actorId = null, actorRole = null, entityType = null, entityId = null, metadata = {}, req = null } = {}) {
  try {
    await AuditLog.create({
      action,
      actorId,
      actorRole,
      entityType,
      entityId: entityId ? String(entityId) : null,
      metadata,
      ip: req ? req.ip : null,
      userAgent: req ? (req.get('user-agent') || null) : null,
    });
  } catch (error) {
    logger.error('failed to write audit log', { action, message: error.message });
  }
}

module.exports = { record };
