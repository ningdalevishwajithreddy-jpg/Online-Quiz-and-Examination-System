import { Ban, Eye, Fingerprint, KeyRound, Lock, Scale, ShieldAlert } from 'lucide-react';

import { Card } from '../ui/Card';

const PROTECTIONS = [
  {
    icon: KeyRound,
    title: 'Session security',
    body: 'JWTs are stored in httpOnly cookies - never in localStorage - with SameSite protection, Secure cookies in production and CSRF double-submit tokens plus origin checks on every state-changing request.',
  },
  {
    icon: Lock,
    title: 'Credential handling',
    body: 'Passwords are hashed with bcrypt at cost 12, must be at least eight characters with letters and numbers, and repeated failures temporarily lock the account. Login errors stay generic.',
  },
  {
    icon: Fingerprint,
    title: 'Authorization',
    body: 'Role and ownership checks run on the server for every endpoint. Client-supplied roles, identities, scores and pass status are rejected, not trusted.',
  },
  {
    icon: ShieldAlert,
    title: 'Answer-key protection',
    body: 'Answer keys never appear in student-facing payloads or REST responses; they are only revealed to authorized teachers/admins, or to a student once the review policy allows it.',
  },
  {
    icon: Scale,
    title: 'Integrity of grading',
    body: 'Attempts store an immutable question snapshot. Grading compares server-stored keys, is idempotent, and rejects zero-total-mark grading so a submission can never be graded twice.',
  },
  {
    icon: Eye,
    title: 'Monitoring ethics',
    body: 'No webcam, microphone or biometric capture. Optional fullscreen and tab-visibility warnings are informational only, and a disconnection is never treated as evidence of misconduct.',
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Security &amp; integrity, stated plainly</h2>
          <p className="mt-4 text-[var(--color-ink-muted)]">
            Exam software holds sensitive data, so we document what is protected, and what genuinely is not.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROTECTIONS.map((item) => (
            <Card key={item.title} className="h-full">
              <span className="grid size-10 place-items-center rounded-xl bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)]">
                <item.icon className="size-5 text-[var(--color-success)]" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">{item.body}</p>
            </Card>
          ))}
        </div>

        <Card id="integrity" className="mt-8 border-[color-mix(in_srgb,var(--color-warning)_32%,transparent)]">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Ban className="size-4.5 text-[var(--color-warning)]" aria-hidden="true" />
            Honest limitations
          </h3>
          <ul className="mt-3 grid gap-2 text-sm text-[var(--color-ink-muted)] sm:grid-cols-2">
            <li>• Browser-based exams cannot prove who is at the keyboard; identity verification is out of scope.</li>
            <li>• A second device or a photograph of the screen cannot be detected by this system.</li>
            <li>• Tab-visibility and fullscreen signals are weak, spoofable hints - not proof of cheating.</li>
            <li>• Server-authoritative timing defends against clock tampering, not against a determined human.</li>
          </ul>
        </Card>
      </div>
    </section>
  );
}

export default SecuritySection;
