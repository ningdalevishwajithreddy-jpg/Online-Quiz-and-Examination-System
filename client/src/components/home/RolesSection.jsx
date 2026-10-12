import { ClipboardCheck, Radio, ShieldCheck, Users } from 'lucide-react';

import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

const ROLES = [
  {
    name: 'Administrator',
    icon: ShieldCheck,
    tone: 'danger',
    summary: 'Runs the institution',
    capabilities: [
      'Manage users and assign roles',
      'View every quiz, attempt and result',
      'Configure policy and invigilator assignments',
      'Export reports and read the audit log',
    ],
  },
  {
    name: 'Teacher',
    icon: Users,
    tone: 'brand',
    summary: 'Owns their quizzes',
    capabilities: [
      'Create, edit, publish and archive own quizzes',
      'Configure marks, duration, instructions and pass mark',
      'See results and analytics for own quizzes only',
    ],
  },
  {
    name: 'Student',
    icon: ClipboardCheck,
    tone: 'accent',
    summary: 'Takes examinations',
    capabilities: [
      'Browse available published quizzes',
      'Take eligible attempts with autosave',
      'View permitted results and attempt history',
      'Request exam assistance during a session',
    ],
  },
  {
    name: 'Invigilator',
    icon: Radio,
    tone: 'warning',
    summary: 'Monitors assigned sessions',
    capabilities: [
      'See assigned exams and live session status',
      'Respond to assistance requests',
      'Record timestamped incidents and escalate',
      'Never modifies answers, deadlines or scores',
    ],
  },
];

export function RolesSection() {
  return (
    <section id="roles" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Four roles, one permission model</h2>
          <p className="mt-4 text-[var(--color-ink-muted)]">
            Permissions are derived from the verified session on the server. The UI adapts, but the API is the
            authority - and it checks ownership on every request.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((role) => (
            <Card key={role.name} className="flex h-full flex-col">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-white/5">
                  <role.icon className="size-5 text-[var(--color-brand-400)]" aria-hidden="true" />
                </span>
                <Badge tone={role.tone}>{role.summary}</Badge>
              </div>
              <h3 className="mt-4 text-base font-semibold">{role.name}</h3>
              <ul className="mt-3 space-y-2 text-sm text-[var(--color-ink-muted)]">
                {role.capabilities.map((capability) => (
                  <li key={capability} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-accent-400)]" aria-hidden="true" />
                    {capability}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RolesSection;
