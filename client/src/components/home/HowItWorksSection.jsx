import { BarChart3, CheckCheck, ClipboardList, FileCheck2, Send, Timer } from 'lucide-react';

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Create',
    description:
      'A teacher builds a quiz: questions, marks, duration, pass percentage, availability window and release policy. Everything is validated on the server.',
  },
  {
    icon: FileCheck2,
    title: 'Publish',
    description:
      'Publishing requires at least one valid question and positive total marks. Once attempts exist the quiz content is locked and versioned.',
  },
  {
    icon: Timer,
    title: 'Take the timed exam',
    description:
      'The student confirms the integrity notice, then gets a server-created attempt with a deadline, autosave and server-confirmed save status.',
  },
  {
    icon: Send,
    title: 'Server-grade',
    description:
      'On submit the server compares answers with the stored answer key, applies configured negative marking and records counts and topic breakdown.',
  },
  {
    icon: BarChart3,
    title: 'View results',
    description:
      'The student sees a score ring, pass/fail and permitted review; the teacher sees distribution and most-missed questions; admins see aggregates.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-4 text-[var(--color-ink-muted)]">
            Five steps from an empty quiz to a graded result, with the security boundary drawn at the API.
          </p>
        </div>

        <ol className="mt-10 grid gap-5 lg:grid-cols-5">
          {STEPS.map((step, index) => (
            <li key={step.title} className="glass relative rounded-[var(--radius-card)] p-5">
              <span className="absolute right-4 top-4 text-3xl font-semibold text-[color-mix(in_srgb,var(--color-ink)_12%,transparent)]">
                {index + 1}
              </span>
              <span className="grid size-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-accent-400)_16%,transparent)]">
                <step.icon className="size-5 text-[var(--color-accent-400)]" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">{step.description}</p>
            </li>
          ))}
        </ol>

        <p className="mt-8 flex items-start gap-2 text-sm text-[var(--color-ink-dim)]">
          <CheckCheck className="mt-0.5 size-4 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
          Every step maps to real HTTP endpoints and MongoDB documents - no mocked screens. Phase 1 delivers the
          foundation and authentication; quiz authoring, the exam runner, grading and analytics arrive in the next
          phases.
        </p>
      </div>
    </section>
  );
}

export default HowItWorksSection;
