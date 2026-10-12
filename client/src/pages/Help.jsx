import { Activity, KeyRound, LifeBuoy, Mail, Radio, ShieldCheck } from 'lucide-react';

import FaqSection from '../components/home/FaqSection';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/ui/StatusPill';
import { useApiHealth } from '../hooks/useApiHealth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatDateTime } from '../utils/format';
import { CONTACT_EMAIL } from '../utils/appConfig';

const EXAM_RULES = [
  'Read the instructions on the quiz page before you confirm and start; the clock starts at confirmation.',
  'The countdown is calculated from the server deadline, so refreshing or reopening the tab does not add time.',
  'Answers save automatically on every change. Wait for "Saved at …" before closing the tab.',
  'If you lose connectivity, keep working: queued answers synchronize when the connection returns.',
  'Submit before the deadline. Expired attempts are auto-submitted and graded from the last saved answers.',
  'Shortcuts: use ← / → to move between questions and 1-6 to select an option.',
];

export default function Help() {
  useDocumentTitle('Help & FAQ');
  const { status, details, refresh } = useApiHealth({ intervalMs: 20000 });

  return (
    <>
      <section className="px-4 pt-14 pb-2 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-dim)]">Help</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Support, exam rules and troubleshooting
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--color-ink-muted)]">
            Start with the FAQ. If you are still stuck, the contact details below reach a human - and the platform
            status panel shows whether the API and database are healthy right now.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Card>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Radio className="size-5 text-[var(--color-warning)]" aria-hidden="true" />
              Exam rules
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-[var(--color-ink-muted)]">
              {EXAM_RULES.map((rule) => (
                <li key={rule} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-warning)]" aria-hidden="true" />
                  {rule}
                </li>
              ))}
            </ul>
          </Card>

          <div className="space-y-6">
            <Card>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Activity className="size-5 text-[var(--color-accent-400)]" aria-hidden="true" />
                Platform status
              </h2>
              <div className="mt-3 space-y-2 text-sm text-[var(--color-ink-muted)]">
                <p className="flex flex-wrap items-center gap-2">
                  API and database: <StatusBadge status={status} />
                </p>
                {details ? (
                  <>
                    <p>Version: {details.api?.version}</p>
                    <p>Environment: {details.environment}</p>
                    <p>Database: {details.database?.status}</p>
                    <p>Checked: {formatDateTime(details.timestamp)}</p>
                  </>
                ) : (
                  <p>Waiting for the first health check…</p>
                )}
              </div>
              <button
                type="button"
                onClick={refresh}
                className="mt-4 rounded-lg text-sm font-medium text-[var(--color-accent-300)] hover:underline"
              >
                Re-check now
              </button>
            </Card>

            <Card>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <LifeBuoy className="size-5 text-[var(--color-brand-400)]" aria-hidden="true" />
                Contact support
              </h2>
              <p className="mt-2 flex items-center gap-2 text-sm">
                <Mail className="size-4 text-[var(--color-accent-400)]" aria-hidden="true" />
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <Badge tone="warning" className="mt-3">
                Placeholder address
              </Badge>
              <p className="mt-3 text-xs text-[var(--color-ink-dim)]">
                Response times are not guaranteed. For security issues, include the request id shown in your browser
                network tab so it can be correlated with server logs.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-4 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-3">
          <Card>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <KeyRound className="size-4.5 text-[var(--color-brand-400)]" aria-hidden="true" />
              I cannot sign in
            </h3>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              Repeated failures temporarily lock the account. Wait for the lock window to pass, then try again. Password
              resets are issued by an administrator in this phase.
            </p>
          </Card>
          <Card>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="size-4.5 text-[var(--color-success)]" aria-hidden="true" />
              Session expired mid-exam
            </h3>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              Sign in again - you are returned to the page you were on, and in-progress attempts are restored from the
              server rather than from browser storage.
            </p>
          </Card>
          <Card>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Activity className="size-4.5 text-[var(--color-warning)]" aria-hidden="true" />
              "Degraded: database unreachable"
            </h3>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              The API is running but cannot reach MongoDB. Check that <code>mongod</code> is running or that your
              <code className="ml-1">MONGO_URI</code> is correct, then re-check the status panel.
            </p>
          </Card>
        </div>
      </section>

      <FaqSection heading="Full FAQ" />
    </>
  );
}
