import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';

/**
 * Toast notifications.
 *
 * The viewport is a live region so screen readers announce every message, and
 * each toast can be dismissed with the keyboard.
 */

const ToastContext = createContext(null);

const VARIANTS = {
  success: { icon: CheckCircle2, accent: 'text-[var(--color-success)]', role: 'status' },
  error: { icon: XCircle, accent: 'text-[var(--color-danger)]', role: 'alert' },
  warning: { icon: TriangleAlert, accent: 'text-[var(--color-warning)]', role: 'alert' },
  info: { icon: Info, accent: 'text-[var(--color-accent-400)]', role: 'status' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const counter = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    ({ title, description, variant = 'info', duration = 5000 }) => {
      counter.current += 1;
      const id = `toast-${counter.current}`;
      const toast = { id, title, description, variant: VARIANTS[variant] ? variant : 'info' };

      setToasts((current) => [...current, toast].slice(-4));

      if (duration > 0) {
        const timer = setTimeout(() => dismissToast(id), duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [dismissToast],
  );

  useEffect(
    () => () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    },
    [],
  );

  const value = useMemo(
    () => ({
      pushToast,
      dismissToast,
      toast: {
        success: (title, description) => pushToast({ title, description, variant: 'success' }),
        error: (title, description) => pushToast({ title, description, variant: 'error', duration: 7000 }),
        warning: (title, description) => pushToast({ title, description, variant: 'warning' }),
        info: (title, description) => pushToast({ title, description, variant: 'info' }),
      },
    }),
    [dismissToast, pushToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end"
        aria-live="polite"
      >
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const variant = VARIANTS[toast.variant];
  const Icon = variant.icon;

  return (
    <div
      role={variant.role}
      className="glass pointer-events-auto flex w-full max-w-sm animate-rise items-start gap-3 rounded-2xl px-4 py-3 text-sm"
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${variant.accent}`} aria-hidden="true" />
      <div className="flex-1">
        <p className="font-medium text-[var(--color-ink)]">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-[var(--color-ink-muted)]">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded-lg p-1 text-[var(--color-ink-dim)] transition hover:bg-white/5 hover:text-[var(--color-ink)]"
        aria-label={`Dismiss notification: ${toast.title}`}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
}

export default ToastContext;
