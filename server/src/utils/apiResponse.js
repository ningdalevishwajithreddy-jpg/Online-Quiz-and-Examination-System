'use strict';

/** Consistent success envelope: { success, data, message? }. */
function sendSuccess(res, data, { statusCode = 200, message } = {}) {
  const payload = { success: true, data };
  if (message) payload.message = message;
  return res.status(statusCode).json(payload);
}

module.exports = { sendSuccess };
