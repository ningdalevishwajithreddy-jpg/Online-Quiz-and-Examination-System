import { CheckCircle2, CircleDot, Mail, ShieldCheck } from 'lucide-react';

import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { CONTACT_EMAIL } from '../utils/appConfig';

const DELIVERED = [
  'Monorepo foundation: Express 5 API + React 19/Vite client',
  'Zod-validated environment configuration and fail-fast production checks',
  'MongoDB connection layer with degraded-mode health reporting (GET /api/health)',
  'Authentication: register (students only), login, logout, session read, profile and password change',
  'JWT in httpOnly cookies, CSRF double-submit protection, origin checks, rate limiting, account lockout',
  'Centralized error handling with a consistent { success: false, message, errors } envelope',
  'Append-only audit log for security-relevant auth events',
  'Development seed script creating one clearly-labelled demo account per role',
  'Jest + Supertest suite running against an in-memory MongoDB',
  'Design system: glass surfaces, palette tokens, accessible primitives, responsive shell',
];

const ROADMAP = [
  {
    phase: 'Phase 2',
    title: 'Users, roles & admin user management',
    detail: 'Admin CRUD for users, role assignment, suspension and invigilator assignment.',
  },
  {
    phase: 'Phase 3',
    title: 'Quiz & question authoring',
    detail: 'Quiz settings, question editor, publish validation, versioning and CSV import stretch goal.',
  },
  {
    phase: 'Phase 4',
    title: 'Student dashboard & exam runner',
    detail: 'Available quizzes, attempt creation, autosave, recovery, question palette and light mode.',
  },
  {
    phase: 'Phase 5',
    title: 'Grading, results & analytics',
    detail: 'Grading engine, result review, dashboards, score distribution and CSV exports.',
  },
  {
    phase: 'Phase 6',
    title: 'Invigilator center & notifications',
    detail: 'Live session monitoring, assistance requests, incident logging and in-app notifications.',
  },
];

export default function About() {
  useDocumentTitle('About');

  return (
    <>
      <section className="px-4 pt-14 pb-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-dim)]">About</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Why QuizSphere exists
          </h1>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4 text-[var(--color-ink-muted)]">
              <p>
                Most quiz projects stop at a pretty form that posts a score to the browser. That is exactly the pattern
                that makes exam software untrustworthy: if the client computes or reports the score, the result means
                nothing.
              </p>
              <p>
                QuizSphere is built the other way around. The server owns the clock, the question snapshot and the
                answer key. The browser only displays state and sends answers. Every number a student sees - score,
                percentage, pass or fail - was calculated by the grading service from data the student could not touch.
              </p>
              <p>
                It was also built to be honest about its limits. Browser-based proctoring is weak, so the platform says
                so instead of claiming AI misconduct detection. Email is optional, so the app never claims a message was
                delivered when no provider is configured.
              </p>
            </div>

            <Card className="h-full">
              <h2 className="text-base font-semibold">Contact</h2>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                Questions, bug reports or collaboration requests:
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm font-medium">
                <Mail className="size-4 text-[var(--color-accent-400)]" aria-hidden="true" />
                {CONTACT_EMAIL}
              </p>
              <Badge tone="warning" className="mt-3">
                Placeholder address - replace before publishing
              </Badge>
              <p className="mt-3 text-xs text-[var(--color-ink-dim)]">
                Set <code>VITE_CONTACT_EMAIL</code> in <code>client/.env</code>. The Contact page opens your own mail
                client; the server only sends email when a provider is configured.
              </p>
              <Button variant="secondary" size="sm" to="/contact" className="mt-4">
                Open contact form
              </Button>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CheckCircle2 className="size-5 text-[var(--color-success)]" aria-hidden="true" />
              Implemented today (Phase 1)
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--color-ink-muted)]">
              {DELIVERED.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="size-5 text-[var(--color-brand-400)]" aria-hidden="true" />
              Planned next
            </h2>
            <ol className="mt-4 space-y-4">
              {ROADMAP.map((item) => (
                <li key={item.phase} className="flex gap-3">
                  <CircleDot className="mt-0.5 size-4 shrink-0 text-[var(--color-ink-dim)]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium">
                      <span className="text-[var(--color-ink-dim)]">{item.phase} · </span>
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </section>
    </>
  );
}
