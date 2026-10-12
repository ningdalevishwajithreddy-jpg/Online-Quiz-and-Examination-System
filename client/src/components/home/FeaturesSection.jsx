import {
  BarChart3,
  ClipboardList,
  Download,
  Radio,
  ShieldCheck,
  Smartphone,
  Timer,
  Trophy,
} from 'lucide-react';

import { Card } from '../ui/Card';

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Quiz creation',
    description:
      'Build quizzes with single-answer MCQ and true/false questions, per-question marks, topics and difficulty - owned by the teacher who created them.',
  },
  {
    icon: Timer,
    title: 'Timed exams',
    description:
      'Each attempt gets a server-calculated deadline stored in MongoDB. The browser countdown is display only, so refreshing or reconnecting never buys extra time.',
  },
  {
    icon: Trophy,
    title: 'Automatic grading',
    description:
      'Submissions are graded on the server against the immutable question snapshot, with optional negative marking and round-safe percentage maths.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description:
      'Score distributions, attempt trends, topic breakdowns and pass rates computed from real database records, scoped to the viewer’s role.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    description:
      'Four roles - admin, teacher, student and invigilator - enforced on every endpoint. Hiding a button is never treated as authorization.',
  },
  {
    icon: Radio,
    title: 'Attempt tracking',
    description:
      'Answers autosave on every change with server confirmation, and in-progress attempts are recovered from the server after a refresh or disconnection.',
  },
  {
    icon: Download,
    title: 'Downloadable reports',
    description:
      'Authorized teachers and admins export attempt and result data as CSV, generated from the same queries that power the dashboards.',
  },
  {
    icon: Smartphone,
    title: 'Mobile support',
    description:
      'Responsive layouts with a collapsible sidebar, keyboard-accessible exam navigation and calm, distraction-free exam screens.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything an examination workflow needs
          </h2>
          <p className="mt-4 text-[var(--color-ink-muted)]">
            Each capability below is implemented end to end - REST endpoints, MongoDB persistence,
            server-side validation and automated tests.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="h-full transition-transform duration-300 hover:-translate-y-1">
              <span className="grid size-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-brand-500)_18%,transparent)]">
                <feature.icon className="size-5 text-[var(--color-brand-400)]" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
