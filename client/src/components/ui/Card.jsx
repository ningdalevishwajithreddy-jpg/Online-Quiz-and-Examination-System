import { cn } from '../../utils/cn';

export function Card({ as: Tag = 'section', className, glass = true, children, ...rest }) {
  return (
    <Tag
      className={cn(
        'rounded-[var(--radius-card)] p-5',
        glass ? 'glass' : 'border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-surface)_60%,transparent)]',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, icon: Icon, action, className }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-brand-500)_18%,transparent)]">
            <Icon className="size-4.5 text-[var(--color-brand-400)]" aria-hidden="true" />
          </span>
        ) : null}
        <div>
          <h3 className="text-base font-semibold leading-tight">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{description}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('space-y-3', className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return (
    <div className={cn('mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--color-line)] pt-4', className)}>
      {children}
    </div>
  );
}
