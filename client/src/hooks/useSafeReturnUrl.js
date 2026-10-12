import { useSearchParams } from 'react-router';

/**
 * Reads ?returnUrl= from the query string.
 *
 * Only same-site relative paths are accepted, so the login form cannot be
 * turned into an open redirect. Falls back when the value is missing or unsafe.
 */
export function useSafeReturnUrl(fallback = '/dashboard') {
  const [searchParams] = useSearchParams();
  const candidate = searchParams.get('returnUrl');

  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) {
    return fallback;
  }

  return candidate;
}

export default useSafeReturnUrl;
