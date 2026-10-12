import { Link } from 'react-router';
import { BookOpen, Code2, Mail, ShieldCheck } from 'lucide-react';

import { Logo } from '../ui/Logo';
import { APP_NAME, CONTACT_EMAIL } from '../../utils/appConfig';

const linkGroups = [
  {
    heading: 'Platform',
    links: [
      { label: 'Features', to: '/features' },
      { label: 'How it works', to: '/#how-it-works' },
      { label: 'Security & integrity', to: '/#security' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'Log in', to: '/login' },
      { label: 'Get started', to: '/register' },
      { label: 'About', to: '/about' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { label: 'Help & FAQ', to: '/help' },
      { label: 'Contact', to: '/contact' },
      { label: 'Exam rules', to: '/#integrity' },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-surface)_35%,transparent)]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8">
        <div className="space-y-4">
          <Logo size="md" showTagline />
          <p className="max-w-sm text-sm text-[var(--color-ink-muted)]">
            {APP_NAME} is a MERN exam management system for creating timed quizzes, grading every
            submission on the server and understanding performance through role-scoped analytics.
          </p>
          <p className="text-xs text-[var(--color-ink-dim)]">
            Built with React, Vite, Tailwind CSS, Node.js, Express, MongoDB and Mongoose. REST API with
            JWT cookie sessions, Zod validation and automated tests.
          </p>
        </div>

        {linkGroups.map((group) => (
          <div key={group.heading}>
            <h2 className="text-sm font-semibold">{group.heading}</h2>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-accent-300)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 border-t border-[var(--color-line)] px-4 py-6 text-xs text-[var(--color-ink-dim)] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>
          © {year} {APP_NAME}. Built as a hackathon-ready reference implementation.
        </p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            No webcam, microphone or biometric capture
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="size-3.5" aria-hidden="true" />
            <Link to="/help" className="transition-colors hover:text-[var(--color-accent-300)]">
              Documentation
            </Link>
          </span>
          <a
            className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--color-accent-300)]"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            <Mail className="size-3.5" aria-hidden="true" />
            {CONTACT_EMAIL}
            <span className="sr-only">(placeholder address - replace before publishing)</span>
          </a>
          <span className="inline-flex items-center gap-1.5">
            <Code2 className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Source repository</span>
            <span aria-hidden="true">Repository not published</span>
          </span>
        </div>
      </div>

      <p className="mx-auto w-full max-w-7xl px-4 pb-6 text-[0.7rem] leading-relaxed text-[var(--color-ink-dim)] sm:px-6 lg:px-8">
        Contact details are placeholders: set <code className="text-[var(--color-ink-muted)]">VITE_CONTACT_EMAIL</code> in
        <code className="ml-1 text-[var(--color-ink-muted)]">client/.env</code> before publishing. Email delivery is only
        attempted when a mail provider is configured on the server.
      </p>
    </footer>
  );
}

export default Footer;
