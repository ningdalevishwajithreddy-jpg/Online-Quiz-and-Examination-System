import { useCallback, useEffect, useRef, useState } from 'react';

import healthApi from '../api/healthApi';

/**
 * Polls /api/health.
 *
 * Reports one of: 'checking' | 'operational' | 'degraded' | 'unreachable'.
 * The status is informational only - it never blocks the UI.
 */
export function useApiHealth({ intervalMs = 30000, enabled = true } = {}) {
  const [state, setState] = useState({ status: 'checking', details: null });
  const mounted = useRef(true);

  const check = useCallback(async () => {
    try {
      const health = await healthApi.getHealth();
      if (!mounted.current) return;
      if (!health) {
        setState({ status: 'unreachable', details: null });
        return;
      }
      setState({
        status: health.database?.connected ? 'operational' : 'degraded',
        details: health,
      });
    } catch {
      if (mounted.current) setState({ status: 'unreachable', details: null });
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!enabled) return undefined;

    // Deferred to the next task so the first response never triggers a second
    // render inside the same commit, then repeated on the interval.
    const initialTimer = window.setTimeout(check, 0);
    const timer = window.setInterval(check, intervalMs);

    return () => {
      mounted.current = false;
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [check, enabled, intervalMs]);

  return { ...state, refresh: check };
}

export default useApiHealth;
