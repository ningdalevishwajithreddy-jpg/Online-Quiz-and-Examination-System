import { lazy, Suspense } from 'react';
import { BarChart3, PlayCircle, Sparkles, Timer, Trophy } from 'lucide-react';

import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton, SkeletonText } from '../ui/Feedback';
import { StatusPill } from '../ui/StatusPill';

// Recharts is only needed for the preview panel, so it loads in its own chunk.
const ProductPreview = lazy(() => import('./ProductPreview'));

function PreviewFallback() {
  return (
    <div className="glass space-y-4 rounded-[var(--radius-card)] p-5" role="status" aria-live="polite">
      <span className="sr-only">Loading product preview</span>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-56 w-full" />
      <SkeletonText lines={2} />
    </div>
  );
}

const HIGHLIGHTS = [
  { icon: Timer, label: 'Server-authoritative timing', tone: 'accent' },
  { icon: Trophy, label: 'Automatic grading', tone: 'success' },
  { icon: BarChart3, label: 'Database-backed analytics', tone: 'brand' },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pt-14 pb-10 sm:px-6 lg:px-8 lg:pt-20">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div className="animate-rise">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="brand" icon={Sparkles}>
              MERN exam management platform
            </Badge>
            <StatusPill />
          </div>

          <h1 className="mt-6 text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.15rem]">
            Smarter Exams. <span className="gradient-text">Faster Results.</span> Better Learning.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-ink-muted)] sm:text-lg">
            Create timed examinations, evaluate answers automatically, and understand student performance
            through one secure, easy-to-use platform.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" to="/register" icon={PlayCircle}>
              Explore Quizzes
            </Button>
            <Button size="lg" variant="secondary" to="/features" icon={Sparkles}>
              Discover Features
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm text-[var(--color-ink-muted)]">
                <item.icon className="size-4 text-[var(--color-accent-400)]" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <Suspense fallback={<PreviewFallback />}>
          <ProductPreview />
        </Suspense>
      </div>
    </section>
  );
}

export default HeroSection;
