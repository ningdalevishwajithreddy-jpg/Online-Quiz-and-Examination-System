import { cn } from '../../utils/cn';

/**
 * Badge - small status/label pill.
 * `tone` maps to the palette's semantic colours and is always paired with text
 * (never colour alone), so the meaning survives for colour-blind users.
 */

const TONES = {
  neutral: 'border-[var(--color-line)] bg-white/5 text-[var(--color-ink-muted)]',
  brand: 'border-[color-mix(in_srgb,var(--color-brand-400)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-brand-500)_18%,transparent)] text-[var(--color-brand-200)]',
  accent: 'border-[color-mix(in_srgb,var(--color-accent-400)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-accent-400)_14%,transparent)] text-[var(--color-accent-300)]',
  success: 'border-[color-mix(in_srgb,var(--color-success)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)] text-[var(--color-success)]',
  warning: 'border-[color-mix(in_srgb,var(--color-warning)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-warning)_14%,transparent)] text-[var(--color-warning)]',
  danger: 'border-[color-mix(in_srgb,var(--color-danger)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_14%,transparent)] text-[var(--color-danger)]',
};

export function Badge({ tone = 'neutral', icon: Icon, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONES[tone] || TONES.neutral,
        className,
      )}
    >
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
