import { BadgeCheck, CalendarClock, Database, Gauge, ListChecks, Radio, ScrollText, Server } from 'lucide-react';

import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/Feedback';
import { StatusBadge } from '../components/ui/StatusPill';
import { useAuth } from '../context/AuthContext';
import { useApiHealth } from '../hooks/useApiHealth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatDateTime, formatNumber } from '../utils/format';
import { capabilitiesFor } from '../utils/permissions';

const UPCOMING = [
  { phase: 'Next', title: 'Quiz authoring', detail: 'Teachers create quizzes, questions and publishing rules.' },
  { phase: 'Then', title: 'Exam runner', detail: 'Students take timed attempts with autosave and recovery.' },
  { phase: 'Then', title: 'Grading & results', detail: 'Server grading, result review and CSV exports.' },
  { phase: 'Then', title: 'Invigilator center', detail: 'Live session monitoring, incidents and notifications.' },
];

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user, roleLabel } = useAuth();
  const { status, details } = useApiHealth({ intervalMs: 45000 });
  const capabilities = capabilitiesFor(user?.role);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-dim)]">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-2 text-[var(--color-ink-muted)]">
            Signed in as <Badge tone="brand">{roleLabel || user?.role}</Badge>
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader icon={Server} title="Platform status" description="Live from GET /api/health." />
          <div className="space-y-2 text-sm text-[var(--color-ink-muted)]">
            <p className="flex flex-wrap items-center gap-2">
              API + database: <StatusBadge status={status} />
            </p>
            {details ? (
              <>
                <p className="flex items-center gap-2">
                  <Database className="size-3.5" aria-hidden="true" />
                  MongoDB: {details.database?.status}
                  {details.database?.name ? ` (${details.database.name})` : ''}
                </p>
                <p className="flex items-center gap-2">
                  <Server className="size-3.5" aria-hidden="true" />
                  API v{details.api?.version} · {details.environment}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarClock className="size-3.5" aria-hidden="true" />
                  Uptime {formatNumber(details.uptimeSeconds)}s
                </p>
              </>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader icon={Gauge} title="Your account" description="Data returned by GET /api/auth/me." />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-ink-muted)]">Name</dt>
              <dd className="truncate">{user?.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-ink-muted)]">Email</dt>
              <dd className="truncate">{user?.email}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-ink-muted)]">Last sign-in</dt>
              <dd>{formatDateTime(user?.lastLoginAt)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-ink-muted)]">Status</dt>
              <dd>
                <Badge tone={user?.status === 'active' ? 'success' : 'warning'} icon={BadgeCheck}>
                  {user?.status}
                </Badge>
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader icon={BadgeCheck} title="What your role can do" description="Enforced server-side, not by the UI." />
          <ul className="space-y-2 text-sm text-[var(--color-ink-muted)]">
            {capabilities.map((capability) => (
              <li key={capability} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-accent-400)]" aria-hidden="true" />
                {capability}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader
          icon={ListChecks}
          title="My quizzes"
          description="Published quizzes you are eligible to attempt will be listed here."
        />
        <EmptyState
          icon={ScrollText}
          title="No quizzes to show yet"
          description="This phase delivers the foundation and authentication. Quiz browsing, authoring and attempts are implemented in the next phases, backed by real endpoints - nothing here is mocked."
        />
      </Card>

      <Card>
        <CardHeader icon={Radio} title="Coming next" description="The roadmap, in the order it will be built." />
        <ol className="grid gap-3 sm:grid-cols-2">
          {UPCOMING.map((item) => (
            <li key={item.title} className="glass-soft rounded-2xl p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-dim)]">
                {item.phase}
              </p>
              <p className="mt-1 text-sm font-medium">{item.title}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{item.detail}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
