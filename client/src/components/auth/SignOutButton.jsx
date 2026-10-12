import { useCallback, useState } from 'react';
import { LogOut } from 'lucide-react';

import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../utils/cn';

/**
 * Sign out - always confirms first, because an accidental sign-out during an
 * exam would be disruptive. The server clears the httpOnly cookie; the client
 * state is cleared in AuthContext.
 *
 * Navigation is deliberately left to the route guard: once the session clears,
 * RequireAuth redirects a protected page to /login with the return URL, so the
 * user can sign straight back in where they left off. Navigating here as well
 * would race the guard and produce two different destinations.
 */
export function SignOutButton({ variant = 'ghost', size = 'md', className, iconOnly = false, showLabel = true }) {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = useCallback(async () => {
    setBusy(true);
    try {
      await logout();
      setConfirming(false);
      toast.success('Signed out', 'Your session cookie has been cleared.');
    } catch {
      toast.error('Sign out failed', 'Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }, [logout, toast]);

  return (
    <>
      <Button
        variant={variant}
        size={iconOnly ? 'icon' : size}
        className={cn(className)}
        onClick={() => setConfirming(true)}
        aria-label={iconOnly || !showLabel ? 'Sign out' : undefined}
        icon={LogOut}
      >
        {iconOnly || !showLabel ? null : 'Sign out'}
      </Button>

      <ConfirmDialog
        open={confirming}
        busy={busy}
        tone="danger"
        title="Sign out of QuizSphere?"
        description="You will need to sign in again to continue. Any unsaved exam progress is stored on the server."
        confirmLabel="Sign out"
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}

export default SignOutButton;
