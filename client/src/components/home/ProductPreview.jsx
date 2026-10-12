import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Clock, Radio, ShieldCheck, Timer } from 'lucide-react';

import { Badge } from '../ui/Badge';
import { ScoreRing } from '../ui/ScoreRing';
import { formatCountdown } from '../../utils/format';

/**
 * Illustrative product preview for the landing page.
 *
 * IMPORTANT: this is marketing illustration with SAMPLE data - it is labelled
 * as such in the UI. Every real chart in the app is computed from MongoDB.
 */

const SAMPLE_QUESTION = {
  prompt: 'Which MongoDB feature makes quiz submissions idempotent when a student retries a submit?',
  options: [
    { id: 'A', text: 'A unique compound index on the answer collection' },
    { id: 'B', text: 'An atomic status transition guarded by a conditional update' },
    { id: 'C', text: 'A client supplied submission checksum' },
    { id: 'D', text: 'Google Analytics events' },
  ],
  correctOptionId: 'B',
  selectedOptionId: 'B',
};

const SAMPLE_TREND = [
  { attempt: 'Attempt 1', score: 48 },
  { attempt: 'Attempt 2', score: 61 },
  { attempt: 'Attempt 3', score: 57 },
  { attempt: 'Attempt 4', score: 74 },
  { attempt: 'Attempt 5', score: 82 },
  { attempt: 'Attempt 6', score: 88 },
];

const SAMPLE_OUTCOME = [
  { name: 'Correct', value: 18, colour: 'var(--color-success)' },
  { name: 'Incorrect', value: 4, colour: 'var(--color-danger)' },
  { name: 'Unanswered', value: 3, colour: 'var(--color-warning)' },
];

export function ProductPreview() {
  // A live, display-only countdown makes the preview feel real. The real exam
  // timer is always recomputed from the server deadline.
  const [remainingMs, setRemainingMs] = useState(12 * 60 * 1000 + 30 * 1000);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingMs((current) => (current <= 1000 ? 12 * 60 * 1000 + 30 * 1000 : current - 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const trendData = useMemo(() => SAMPLE_TREND, []);

  return (
    <div className="relative">
      <div
        className="glass animate-rise rounded-[var(--radius-card)] p-5"
        aria-label="Illustrative product preview using sample data"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-dim)]">
              Illustrative preview · sample data
            </p>
            <h3 className="mt-1 text-base font-semibold">Data Structures · Mid-term</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="accent" icon={Radio}>
              Autosaved 14:32:05
            </Badge>
            <Badge tone="warning" icon={Timer} className="font-mono">
              {formatCountdown(remainingMs)}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className="glass-soft rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between text-xs text-[var(--color-ink-dim)]">
              <span>Question 19 of 25</span>
              <span>Marks 1.0</span>
            </div>
            <p className="text-sm font-medium leading-relaxed">{SAMPLE_QUESTION.prompt}</p>
            <ul className="mt-4 space-y-2">
              {SAMPLE_QUESTION.options.map((option) => {
                const isSelected = option.id === SAMPLE_QUESTION.selectedOptionId;
                return (
                  <li
                    key={option.id}
                    className={
                      isSelected
                        ? 'flex items-start gap-3 rounded-xl border border-[color-mix(in_srgb,var(--color-brand-400)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-brand-500)_16%,transparent)] px-3 py-2.5 text-sm'
                        : 'flex items-start gap-3 rounded-xl border border-[var(--color-line)] px-3 py-2.5 text-sm text-[var(--color-ink-muted)]'
                    }
                  >
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-white/8 text-[0.7rem] font-semibold">
                      {option.id}
                    </span>
                    <span>{option.text}</span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 flex items-center gap-2 border-t border-[var(--color-line)] pt-3 text-xs text-[var(--color-ink-dim)]">
              <Clock className="size-3.5" aria-hidden="true" />
              Server-authoritative timing · answers save on every change
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-soft flex items-center justify-between gap-4 rounded-2xl p-4">
              <ScoreRing value={83} sublabel="passed" size={112} label="Sample result" />
              <div className="space-y-2 text-xs">
                <p className="flex items-center gap-2 text-[var(--color-success)]">
                  <span className="size-2 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
                  18 correct
                </p>
                <p className="flex items-center gap-2 text-[var(--color-danger)]">
                  <span className="size-2 rounded-full bg-[var(--color-danger)]" aria-hidden="true" />
                  4 incorrect
                </p>
                <p className="flex items-center gap-2 text-[var(--color-warning)]">
                  <span className="size-2 rounded-full bg-[var(--color-warning)]" aria-hidden="true" />
                  3 unanswered
                </p>
                <p className="pt-1 text-[var(--color-ink-muted)]">Pass mark 50%</p>
              </div>
            </div>

            <div className="glass-soft rounded-2xl p-4">
              <p className="mb-2 text-xs font-medium text-[var(--color-ink-muted)]">Score trend across attempts</p>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                    <defs>
                      <linearGradient id="previewScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" vertical={false} />
                    <XAxis dataKey="attempt" tick={{ fontSize: 9, fill: 'var(--color-ink-dim)' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--color-ink-dim)' }} axisLine={false} tickLine={false} />
                    <ChartTooltip
                      contentStyle={{
                        background: 'rgba(16,26,50,0.95)',
                        border: '1px solid rgba(148,163,184,0.2)',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="var(--color-brand-400)"
                      strokeWidth={2}
                      fill="url(#previewScore)"
                      name="Average score"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-soft flex items-center gap-4 rounded-2xl p-4">
              <div className="h-20 w-20">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={SAMPLE_OUTCOME} dataKey="value" innerRadius={22} outerRadius={38} paddingAngle={3}>
                      {SAMPLE_OUTCOME.map((entry) => (
                        <Cell key={entry.name} fill={entry.colour} stroke="transparent" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs">
                <p className="font-medium text-[var(--color-ink)]">Answer outcome split</p>
                <p className="mt-1 text-[var(--color-ink-dim)]">
                  Computed on the server from the immutable attempt snapshot.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--color-success)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] px-3 py-2 text-xs text-[var(--color-ink-muted)]">
          <ShieldCheck className="size-3.5 text-[var(--color-success)]" aria-hidden="true" />
          The panel above is a static illustration with sample data, not a live exam session.
        </p>
      </div>
    </div>
  );
}

export default ProductPreview;
