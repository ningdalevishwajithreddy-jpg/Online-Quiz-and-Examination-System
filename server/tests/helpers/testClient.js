'use strict';

const request = require('supertest');

/** Reads one cookie value out of a Set-Cookie response. */
function cookieValue(response, name) {
  const raw = response.headers['set-cookie'] || [];
  const entry = raw.find((candidate) => candidate.startsWith(`${name}=`));
  if (!entry) return null;
  const value = entry.split(';')[0].slice(name.length + 1);
  return decodeURIComponent(value);
}

/** True when the response cleared the cookie (Expires in the past / Max-Age=0). */
function isCookieCleared(response, name) {
  const raw = response.headers['set-cookie'] || [];
  const entry = raw.find((candidate) => candidate.startsWith(`${name}=`));
  if (!entry) return false;
  return /Max-Age=0/i.test(entry) || /Expires=Thu, 01 Jan 1970/i.test(entry);
}

function authCookieAttributes(response, name) {
  const raw = response.headers['set-cookie'] || [];
  return raw.find((candidate) => candidate.startsWith(`${name}=`)) || '';
}

/**
 * A supertest agent that behaves like the browser client:
 * it keeps cookies and attaches the double-submit CSRF header.
 */
async function createTestClient(app, csrfCookieName = 'qs_csrf', csrfHeaderName = 'x-csrf-token') {
  const agent = request.agent(app);
  const csrfResponse = await agent.get('/api/auth/csrf');
  const csrfToken = cookieValue(csrfResponse, csrfCookieName) || csrfResponse.body?.data?.csrfToken;

  const withCsrf = (testRequest) => testRequest.set(csrfHeaderName, csrfToken);

  return {
    agent,
    csrfToken,
    csrfResponse,
    get: (url) => agent.get(url),
    post: (url) => withCsrf(agent.post(url)),
    put: (url) => withCsrf(agent.put(url)),
    patch: (url) => withCsrf(agent.patch(url)),
    delete: (url) => withCsrf(agent.delete(url)),
  };
}

module.exports = { authCookieAttributes, cookieValue, createTestClient, isCookieCleared };
