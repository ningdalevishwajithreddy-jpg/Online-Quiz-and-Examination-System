import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Mail, MapPin, Send, ShieldCheck } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input, Select, Textarea } from '../components/ui/Input';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { emailField, nameField } from '../utils/validation';
import { CONTACT_EMAIL } from '../utils/appConfig';

/** Opens the visitor's own mail client (declared outside the component by design). */
function openMailClient(href) {
  window.location.assign(href);
}

const contactSchema = z.object({
  name: nameField,
  email: emailField,
  topic: z.enum(['general', 'exam-issue', 'technical', 'security'], {
    message: 'Choose a topic',
  }),
  message: z
    .string()
    .trim()
    .min(20, 'Please describe your question in at least 20 characters')
    .max(1200, 'Message must be at most 1200 characters'),
});

const TOPICS = [
  { value: 'general', label: 'General question' },
  { value: 'exam-issue', label: 'Problem during an exam' },
  { value: 'technical', label: 'Technical / bug report' },
  { value: 'security', label: 'Security concern' },
];

/**
 * Contact form.
 *
 * No email provider is configured in this phase, so the form does the honest
 * thing: it composes a pre-filled message and opens the visitor's own mail
 * client. Nothing claims to have been "sent" by the server.
 */
export default function Contact() {
  useDocumentTitle('Contact');
  const { toast } = useToast();
  const [composedLink, setComposedLink] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', topic: 'general', message: '' },
  });

  const mailtoHref = useMemo(() => composedLink, [composedLink]);

  const onSubmit = (values) => {
    const subject = `[QuizSphere] ${TOPICS.find((topic) => topic.value === values.topic)?.label || 'Contact'}`;
    const body = [`From: ${values.name} <${values.email}>`, '', values.message].join('\n');
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setComposedLink(href);
    openMailClient(href);

    toast.info(
      'Opening your email client',
      'Nothing is sent by the server - the message opens in your own mail app so you can review and send it.',
    );
  };

  return (
    <>
      <section className="px-4 pt-14 pb-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-dim)]">Contact</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">Get in touch</h1>
          <p className="mt-4 max-w-2xl text-[var(--color-ink-muted)]">
            Questions about the platform, a bug to report or a security concern - all are welcome.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <h2 className="text-lg font-semibold">Send a message</h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              This form validates your input, then opens your email client with the message pre-filled.
            </p>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Your name" required autoComplete="name" error={errors.name?.message} {...register('name')} />
                <Input
                  label="Your email"
                  type="email"
                  required
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <Select label="Topic" options={TOPICS} error={errors.topic?.message} {...register('topic')} />

              <Textarea
                label="Message"
                required
                rows={6}
                placeholder="Describe your question, including the quiz name and approximate time if it relates to an exam."
                error={errors.message?.message}
                {...register('message')}
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" icon={Send} loading={isSubmitting}>
                  Open email draft
                </Button>
                {mailtoHref ? (
                  <a
                    href={mailtoHref}
                    className="text-sm font-medium text-[var(--color-accent-300)] hover:underline"
                  >
                    Reopen the draft
                  </a>
                ) : null}
              </div>
            </form>
          </Card>

          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold">Contact details</h2>
              <p className="mt-3 flex items-center gap-2 text-sm">
                <Mail className="size-4 text-[var(--color-accent-400)]" aria-hidden="true" />
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p className="mt-3 flex items-start gap-2 text-sm text-[var(--color-ink-muted)]">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--color-ink-dim)]" aria-hidden="true" />
                Postal address intentionally omitted from this build.
              </p>
              <Badge tone="warning" className="mt-4">
                Placeholder - replace VITE_CONTACT_EMAIL
              </Badge>
            </Card>

            <Card>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ShieldCheck className="size-5 text-[var(--color-success)]" aria-hidden="true" />
                Reporting a security issue
              </h2>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                Please do not post exploit details publicly. Include the request id from your browser's network tab so
                the event can be found in the server logs.
              </p>
            </Card>

            <Card className="border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)]">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <AlertTriangle className="size-4.5 text-[var(--color-warning)]" aria-hidden="true" />
                What this page does not do
              </h2>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                It does not store submissions in the database and it does not send email from the server. Email
                notifications only activate when a mail provider is configured through the server environment.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
