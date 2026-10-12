import { Activity, Cloud, CloudOff, Database } from 'lucide-react';

import { cn } from '../../utils/cn';
import { useApiHealth } from '../../hooks/useApiHealth';

/**
 * Live platform status indicator.
 *
 * Reads the real /api/health endpoint: it distinguishes "API up, database
 * reachable", "API up, database down" and "API not reachable", so a demo never
 * silently pretends everything is fine.
 */

const STATUS_CONFIG = {
  checking: { label: 'Checking', tone: 'text-[var(--color-ink-dim)]', dot: 'bg-[var(--color-ink-dim)]', Icon: Activity },
  operational: { label: 'All systems operational', tone: 'text-[var(--color-success)]', dot: 'bg-[var(--color-success)]', Icon: Database },
  degraded: { label: 'Degraded: database unreachable', tone: 'text-[var(--color-warning)]', dot: 'bg-[var(--color-warning)]', Icon: Database },
  unreachable: { label: 'API unreachable', tone: 'text-[var(--color-danger)]', dot: 'bg-[var(--color-danger)]', Icon: CloudOff },
};

export function StatusPill({ className, showLabel = true, pollMs = 30000 }) {
  const { status, details } = useApiHealth({ intervalMs: pollMs });
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.checking;
  const { Icon } = config;

  const label = config.label;

  return (
    <span
      role="status"
      className={cn(
        'glass-soft inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium',
        config.tone,
        className,
      )}
      title={
        details
          ? `API ${details.api?.version} · ${details.environment} · database ${details.database?.status}`
          : 'Live platform status'
      }
      aria-live="polite"
    >
      <span className={cn('size-2 rounded-full', config.dot)} aria-hidden="true" />
      <Icon className="size-3.5" aria-hidden="true" />
      {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
    </span>
  );
}

/** Compact variant used inside cards. */
export function StatusBadge({ status = 'checking' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.checking;
  return (
    <span className={cn('inline-flex items-center gap-2 text-xs font-medium', config.tone)}>
      <span className={cn('size-2 rounded-full', config.dot)} aria-hidden="true" />
      {config.label}
    </span>
  );
}

export { Cloud };
