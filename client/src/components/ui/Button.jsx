import { forwardRef } from 'react';
import { Link } from 'react-router';

import { cn } from '../../utils/cn';
import { Spinner } from './Feedback';

/**
 * Button - the single button primitive used across the app.
 * Renders a <Link> when `to` is supplied, otherwise a real <button>.
 */

const VARIANTS = {
  primary:
    'bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-500)] text-white shadow-[0_18px_40px_-18px_rgba(139,92,246,0.65)] hover:from-[var(--color-brand-500)] hover:to-[var(--color-brand-400)]',
  secondary:
    'glass-soft text-[var(--color-ink)] hover:border-[color-mix(in_srgb,var(--color-brand-400)_45%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-brand-500)_12%,transparent)]',
  outline:
    'border border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-accent-400)] hover:text-[var(--color-accent-300)]',
  ghost: 'text-[var(--color-ink-muted)] hover:bg-white/5 hover:text-[var(--color-ink)]',
  danger:
    'bg-[color-mix(in_srgb,var(--color-danger)_18%,transparent)] text-[var(--color-danger)] border border-[color-mix(in_srgb,var(--color-danger)_40%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-danger)_28%,transparent)]',
};

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'size-10 justify-center',
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    iconRight: IconRight,
    className,
    to,
    href,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  const classes = cn(
    'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-400)]',
    'disabled:cursor-not-allowed disabled:opacity-55',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    className,
  );

  const content = (
    <>
      {loading ? <Spinner className="size-4" label="" /> : Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
      {children ? <span className="truncate">{children}</span> : null}
      {IconRight && !loading ? <IconRight className="size-4" aria-hidden="true" /> : null}
    </>
  );

  if (to && !isDisabled) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href && !isDisabled) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button ref={ref} type={type} className={classes} disabled={isDisabled} aria-busy={loading} {...rest}>
      {content}
    </button>
  );
});
