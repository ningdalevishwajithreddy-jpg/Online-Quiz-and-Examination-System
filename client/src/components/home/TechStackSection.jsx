import { Braces, Database, FileSpreadsheet, Layers, Lock, Server, ShieldCheck, Zap } from 'lucide-react';

import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

const STACK = [
  {
    icon: Layers,
    title: 'MERN frontend',
    items: ['React 19 + Vite', 'React Router', 'Tailwind CSS v4', 'Recharts + Lucide'],
  },
  {
    icon: Server,
    title: 'REST API',
    items: ['Node.js + Express 5', 'Route → controller → service → model', 'Zod validation on every endpoint', 'Consistent JSON error envelope'],
  },
  {
    icon: Database,
    title: 'MongoDB + Mongoose',
    items: ['Timestamps, references, indexes', 'Append-only audit log', 'Immutable attempt snapshots', 'MongoDB Atlas or local mongod'],
  },
  {
    icon: ShieldCheck,
    title: 'Security & quality',
    items: ['JWT httpOnly cookies + CSRF', 'bcrypt cost 12 + lockout', 'Helmet, CORS allowlist, rate limits', 'Jest + Supertest test suite'],
  },
];

const DEMONSTRATES = [
  { icon: Database, label: 'MongoDB CRUD', detail: 'Real documents for users, and (next phases) quizzes, attempts and results.' },
  { icon: Braces, label: 'REST APIs', detail: 'Documented endpoints with correct status codes: 400, 401, 403, 404, 409, 422, 429, 500.' },
  { icon: Lock, label: 'Authentication', detail: 'Register, login, logout, profile and password change with session recovery.' },
  { icon: ShieldCheck, label: 'Authorization', detail: 'Role and ownership enforcement on the server for every request.' },
  { icon: FileSpreadsheet, label: 'Reporting', detail: 'Dashboard statistics and CSV exports computed from database queries.' },
  { icon: Zap, label: 'Server grading', detail: 'Deterministic, idempotent grading engine with negative marking support.' },
];

export function TechStackSection() {
  return (
    <section id="stack" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Built on the MERN stack, end to end</h2>
          <p className="mt-4 text-[var(--color-ink-muted)]">
            A single repository: an Express API with MongoDB persistence and a React client that consumes it.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STACK.map((group) => (
            <Card key={group.title} className="h-full">
              <span className="grid size-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-accent-400)_16%,transparent)]">
                <group.icon className="size-5 text-[var(--color-accent-400)]" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{group.title}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-[var(--color-ink-muted)]">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMONSTRATES.map((item) => (
            <div key={item.label} className="glass-soft rounded-2xl p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <item.icon className="size-4 text-[var(--color-brand-400)]" aria-hidden="true" />
                {item.label}
              </p>
              <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge tone="neutral">GET /api/health</Badge>
          <Badge tone="neutral">POST /api/auth/register</Badge>
          <Badge tone="neutral">POST /api/auth/login</Badge>
          <Badge tone="neutral">GET /api/auth/me</Badge>
          <Badge tone="neutral">PATCH /api/auth/password</Badge>
        </div>
      </div>
    </section>
  );
}

export default TechStackSection;
