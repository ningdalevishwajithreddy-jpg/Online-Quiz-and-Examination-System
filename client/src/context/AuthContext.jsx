import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import authApi from '../api/authApi';
import { UNAUTHORIZED_EVENT } from '../api/httpClient';
import { useToast } from './ToastContext';

/**
 * Session state.
 *
 * The JWT lives in an httpOnly cookie, so the client only ever knows "who am I"
 * by asking GET /api/auth/me. A 401 from any other endpoint clears the session
 * (and AuthContext consumers redirect to /login with the return URL).
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roleLabel, setRoleLabel] = useState('');
  const [status, setStatus] = useState('loading'); // loading | authenticated | anonymous
  const { toast } = useToast();
  const mounted = useRef(true);

  // The flag must be re-armed in the effect body, not just initialised: React
  // StrictMode mounts, unmounts and remounts effects in development, and a
  // one-way `mounted.current = false` would permanently discard the session
  // response (the page would stay stuck on "Checking your session...").
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /** Asks the API who we are. Never sets state synchronously, so it is safe to call from an effect. */
  const bootstrapSession = useCallback(async () => {
    try {
      const session = await authApi.getCurrentUser();
      if (!mounted.current) return;
      setUser(session?.user ?? null);
      setRoleLabel(session?.roleLabel ?? '');
      setStatus(session ? 'authenticated' : 'anonymous');
    } catch {
      if (!mounted.current) return;
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    // Deferred so React finishes mounting before the session state lands
    // (avoids a cascading render and the associated lint rule by design).
    const timer = window.setTimeout(bootstrapSession, 0);
    return () => window.clearTimeout(timer);
  }, [bootstrapSession]);

  /** Explicit re-check, used by event handlers (shows a loading state first). */
  const refreshSession = useCallback(() => {
    setStatus('loading');
    return bootstrapSession();
  }, [bootstrapSession]);

  // Any 401 outside the bootstrap call means the session is gone.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser((current) => {
        if (current) toast.warning('Session expired', 'Please sign in again to continue.');
        return null;
      });
      setStatus('anonymous');
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [toast]);

  const login = useCallback(async (credentials) => {
    const signedIn = await authApi.login(credentials);
    setUser(signedIn);
    setStatus('authenticated');
    return signedIn;
  }, []);

  const register = useCallback(async (payload) => {
    const created = await authApi.register(payload);
    setUser(created);
    setStatus('authenticated');
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setRoleLabel('');
      setStatus('anonymous');
    }
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const updated = await authApi.updateProfile(payload);
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({
      user,
      roleLabel,
      status,
      isAuthenticated: status === 'authenticated' && Boolean(user),
      isInitialising: status === 'loading',
      login,
      register,
      logout,
      updateProfile,
      refreshSession,
    }),
    [login, logout, refreshSession, register, roleLabel, status, updateProfile, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
}

export default AuthContext;
