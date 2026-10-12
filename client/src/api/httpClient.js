import axios from 'axios';

/**
 * Single HTTP client for the whole app.
 *
 * - `withCredentials` so the httpOnly auth cookie is sent
 * - double-submit CSRF: the readable `qs_csrf` cookie is echoed in the
 *   `x-csrf-token` header on every unsafe request
 * - a 401 broadcasts `quizsphere:unauthorized`; AuthContext clears the session
 *   and redirects to /login while preserving the return URL
 * - errors are normalised into { status, message, errors } so UI code never
 *   has to dig through axios internals
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const CSRF_COOKIE_NAME = 'qs_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete']);

export const UNAUTHORIZED_EVENT = 'quizsphere:unauthorized';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

function readCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

let csrfRequest = null;

/** Returns a CSRF token, fetching one from the API if the cookie is missing. */
export async function ensureCsrfToken() {
  const fromCookie = readCookie(CSRF_COOKIE_NAME);
  if (fromCookie) return fromCookie;

  if (!csrfRequest) {
    csrfRequest = api
      .get('/auth/csrf', { skipCsrf: true })
      .then((response) => response.data?.data?.csrfToken || null)
      .catch(() => null)
      .finally(() => {
        csrfRequest = null;
      });
  }

  return csrfRequest;
}

api.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toLowerCase();

  if (UNSAFE_METHODS.has(method) && !config.skipCsrf) {
    const token = await ensureCsrfToken();
    if (token) config.headers[CSRF_HEADER_NAME] = token;
  }

  return config;
});

/** Normalises any failure into a predictable shape for the UI. */
export function toApiError(error) {
  if (error?.response) {
    const { status, data } = error.response;
    return {
      status,
      message: data?.message || 'The request could not be completed.',
      errors: Array.isArray(data?.errors) ? data.errors : [],
    };
  }

  if (error?.code === 'ECONNABORTED') {
    return { status: 0, message: 'The request timed out. Check your connection and try again.', errors: [] };
  }

  return {
    status: 0,
    message: 'Cannot reach the QuizSphere server. Check that the API is running.',
    errors: [],
  };
}

/** Field errors from the API -> { field: message } for form components. */
export function fieldErrorsFrom(apiError) {
  return (apiError?.errors || []).reduce((accumulator, issue) => {
    if (issue?.field && !accumulator[issue.field]) accumulator[issue.field] = issue.message;
    return accumulator;
  }, {});
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalised = toApiError(error);

    // A 401 on the session bootstrap call is expected when signed out.
    const url = error?.config?.url || '';
    const isSessionProbe = url.includes('/auth/me');

    if (normalised.status === 401 && !isSessionProbe) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: normalised }));
    }

    return Promise.reject(normalised);
  },
);

export default api;
