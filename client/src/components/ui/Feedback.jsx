import { AlertTriangle, Loader2, RefreshCw, SearchX } from 'lucide-react';

import { cn } from '../../utils/cn';
import { Button } from './Button';

/** Inline loading indicator with an accessible label. */
export function Spinner({ className, label = 'Loading' }) {
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      <Loader2 className={cn('size-5 animate-spin text-[var(--color-brand-400)]', className)} aria-hidden="true" />
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

/** Skeleton placeholder block. */
export function Skeleton({ className }) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-[color-mix(in_srgb,var(--color-ink)_9%,transparent)]', className)}
      aria-hidden="true"
    />
  );
}

/** A short list of skeleton lines, used while a panel loads. */
export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

/** Friendly empty state with an optional primary action. */
export function EmptyState({ icon: Icon = SearchX, title, description, action, className }) {
  return (
    <div
      className={cn(
        'glass-soft flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-12 text-center',
        className,
      )}
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-brand-500)_18%,transparent)]">
        <Icon className="size-6 text-[var(--color-brand-400)]" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm text-[var(--color-ink-muted)]">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

/** Error state with retry support. */
export function ErrorState({ title = 'Something went wrong', description, onRetry, retryLabel = 'Try again', className }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--color-danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] px-6 py-10 text-center',
        className,
      )}
    >
      <AlertTriangle className="size-7 text-[var(--color-danger)]" aria-hidden="true" />
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="max-w-md text-sm text-[var(--color-ink-muted)]">{description}</p> : null}
      {onRetry ? (
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
