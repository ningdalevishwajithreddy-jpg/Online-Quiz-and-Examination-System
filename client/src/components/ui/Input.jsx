import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '../../utils/cn';

/**
 * Form field primitives.
 *
 * Each control wires up label/description/error with the right ARIA attributes
 * so validation feedback is announced, not just coloured.
 */

const controlClasses =
  'w-full rounded-xl border bg-[color-mix(in_srgb,var(--color-canvas)_65%,transparent)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-400)] disabled:cursor-not-allowed disabled:opacity-60';

function FieldShell({ id, label, hint, error, required, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label htmlFor={id} className="flex items-center gap-1 text-sm font-medium text-[var(--color-ink-muted)]">
          {label}
          {required ? (
            <span className="text-[var(--color-danger)]" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {children}

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-[var(--color-danger)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-[var(--color-ink-dim)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, hint, error, required = false, className, id, type = 'text', ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id || `field-${generatedId}`;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword && revealed ? 'text' : type;

  return (
    <FieldShell id={inputId} label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={cn(
            controlClasses,
            isPassword && 'pr-11',
            error
              ? 'border-[color-mix(in_srgb,var(--color-danger)_55%,transparent)]'
              : 'border-[var(--color-line)] focus:border-[var(--color-brand-400)]',
            className,
          )}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[var(--color-ink-dim)] transition hover:text-[var(--color-ink)]"
            aria-label={revealed ? 'Hide password' : 'Show password'}
            aria-pressed={revealed}
            tabIndex={-1}
          >
            {revealed ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        ) : null}
      </div>
    </FieldShell>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, required = false, className, id, rows = 5, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id || `field-${generatedId}`;

  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(
          controlClasses,
          'resize-y',
          error
            ? 'border-[color-mix(in_srgb,var(--color-danger)_55%,transparent)]'
            : 'border-[var(--color-line)] focus:border-[var(--color-brand-400)]',
          className,
        )}
        {...rest}
      />
    </FieldShell>
  );
});

export const Select = forwardRef(function Select(
  { label, hint, error, required = false, className, id, options = [], placeholder, children, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id || `field-${generatedId}`;

  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required}>
      <select
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(
          controlClasses,
          'appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23a6b0d0%27 stroke-width=%272%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E")] bg-[length:1.1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10',
          error
            ? 'border-[color-mix(in_srgb,var(--color-danger)_55%,transparent)]'
            : 'border-[var(--color-line)] focus:border-[var(--color-brand-400)]',
          className,
        )}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
    </FieldShell>
  );
});
