import { Navigate, useLocation } from 'react-router';
import { Lock } from 'lucide-react';

import { EmptyState, Spinner } from '../ui/Feedback';
import { useAuth } from '../../context/AuthContext';
import { useSafeReturnUrl } from '../../hooks/useSafeReturnUrl';

/**
 * Route guards.
 *
 * The client cannot grant permissions - every API call is authorised again on
 * the server. These guards only decide what is worth rendering, and they
 * preserve the attempted URL so a session expiry does not lose the user's place.
 */

export function RequireAuth({ children }) {
  const { isAuthenticated, isInitialising } = useAuth();
  const location = useLocation();

  if (isInitialising) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-6" label="Checking your session" />
          <p className="text-sm text-[var(--color-ink-muted)]">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnUrl = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />;
  }

  return children;
}

export function RequireRole({ roles, children }) {
  const { user, isInitialising } = useAuth();
  const allowed = Array.isArray(roles) ? roles : [roles];

  if (isInitialising) return <RequireAuth>{null}</RequireAuth>;

  if (!user || !allowed.includes(user.role)) {
    return (
      <EmptyState
        icon={Lock}
        title="You do not have access to this area"
        description={`This page is limited to: ${allowed.join(', ')}. Your role is ${user?.role || 'unknown'}.`}
      />
    );
  }

  return children;
}

/** Keeps signed-in users away from the login/register screens. */
export function RedirectIfAuthenticated({ children }) {
  const { isAuthenticated, isInitialising } = useAuth();
  const returnUrl = useSafeReturnUrl();

  if (isInitialising) return children;
  if (isAuthenticated) return <Navigate to={returnUrl} replace />;
  return children;
}
