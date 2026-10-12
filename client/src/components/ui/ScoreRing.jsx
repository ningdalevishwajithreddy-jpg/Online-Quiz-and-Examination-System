import { cn } from '../../utils/cn';

/**
 * Score ring.
 *
 * Pure SVG (no chart library) so it stays crisp and cheap to render. The value
 * is also exposed as text, never colour alone.
 */
export function ScoreRing({
  value = 0,
  max = 100,
  size = 132,
  strokeWidth = 10,
  label,
  sublabel,
  tone = 'auto',
  className,
}) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percentage = (clamped / safeMax) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  const resolvedTone =
    tone === 'auto' ? (percentage >= 60 ? 'success' : percentage >= 40 ? 'warning' : 'danger') : tone;

  const tones = {
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    brand: 'var(--color-brand-500)',
    accent: 'var(--color-accent-400)',
  };
  const stroke = tones[resolvedTone] || tones.brand;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(percentage)} percent`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="color-mix(in srgb, var(--color-ink) 12%, transparent)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-[var(--color-ink)] text-[1.35rem] font-semibold"
        >
          {Math.round(percentage)}%
        </text>
        {sublabel ? (
          <text
            x="50%"
            y="66%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-[var(--color-ink-dim)] text-[0.7rem]"
          >
            {sublabel}
          </text>
        ) : null}
      </svg>
      {label ? <p className="text-sm font-medium text-[var(--color-ink-muted)]">{label}</p> : null}
    </div>
  );
}

export default ScoreRing;
