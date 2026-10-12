'use strict';

const mongoose = require('mongoose');

/**
 * Append-only audit trail for security relevant actions.
 *
 * There are intentionally no update/delete helpers and the schema never
 * changes an existing document: records are only ever inserted.
 */

const auditLogSchema = new mongoose.Schema(
  {
    /** Null for anonymous actors (e.g. a failed sign-in for an unknown email). */
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorRole: { type: String, default: null },
    action: { type: String, required: true, trim: true },
    entityType: { type: String, default: null, trim: true },
    entityId: { type: String, default: null, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
