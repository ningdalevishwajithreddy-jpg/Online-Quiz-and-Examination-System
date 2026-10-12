import { useId } from 'react';

import { cn } from '../../utils/cn';

/**
 * Lightweight tooltip for icon-only controls.
 *
 * Implemented with CSS so it needs no positioning library, keeps the trigger
 * keyboard focusable, and describes it through aria-describedby. The visible
 * text duplicates the trigger's accessible name only as a hint, never as the
 * only label.
 */
export function Tooltip({ label, children, side = 'top', className }) {
  const id = useId();
  const sideClasses = {
    top: 'bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2',
    bottom: 'top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2',
    right: 'left-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2',
    left: 'right-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2',
  };

  return (
    <span className={cn('group relative inline-flex', className)}>
      <span aria-describedby={id} className="inline-flex">
        {children}
      </span>
      <span
        role="tooltip"
        id={id}
        className={cn(
          'glass pointer-events-none absolute z-40 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs text-[var(--color-ink)] opacity-0 transition-opacity duration-150',
          'group-hover:opacity-100 group-focus-within:opacity-100',
          sideClasses[side] || sideClasses.top,
        )}
      >
        {label}
      </span>
    </span>
  );
}

export default Tooltip;
