import { GraduationCap } from 'lucide-react';

import { cn } from '../../utils/cn';
import { APP_NAME } from '../../utils/appConfig';

/** Brand mark + wordmark, used by the navbar, footer and auth pages. */
export function Logo({ size = 'md', showTagline = false, className, to = '/' }) {
  const sizes = {
    sm: { box: 'size-8', icon: 'size-4', text: 'text-base' },
    md: { box: 'size-10', icon: 'size-5', text: 'text-lg' },
    lg: { box: 'size-12', icon: 'size-6', text: 'text-2xl' },
  };
  const scale = sizes[size] || sizes.md;

  const content = (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'grid place-items-center rounded-xl bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-accent-500)] shadow-[0_10px_30px_-12px_rgba(139,92,246,0.8)]',
          scale.box,
        )}
      >
        <GraduationCap className={cn('text-white', scale.icon)} aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn('font-semibold tracking-tight', scale.text)}>
          {APP_NAME}
        </span>
        {showTagline ? (
          <span className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-dim)]">
            Exam intelligence
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!to) return content;

  return (
    <a href={to} className="rounded-xl transition-opacity hover:opacity-90" aria-label={`${APP_NAME} home`}>
      {content}
    </a>
  );
}

