import { ChevronDown } from 'lucide-react';

import { cn } from '../../utils/cn';

/**
 * FAQ list built on <details>/<summary> so it is keyboard accessible and works
 * without JavaScript state management.
 */
const FAQS = [
  {
    question: 'What is the difference between a quiz and an attempt?',
    answer:
      'A quiz is the definition a teacher authors: questions, marks, duration, pass percentage and availability window. An attempt is a student’s individual run of that quiz, created on the server with a fixed deadline and an immutable snapshot of the questions as they were at that moment.',
  },
  {
    question: 'How is the exam timer enforced if the browser clock is wrong?',
    answer:
      'The browser countdown is display only. The deadline is calculated and stored on the server when the attempt starts, and every save and submission is validated against it. Changing your system clock or refreshing the page does not extend the attempt.',
  },
  {
    question: 'Can a student see the correct answers?',
    answer:
      'Only when the quiz’s review policy allows it - after submission or after the availability window closes. Answer keys are never included in the payload sent to a student’s browser before that point.',
  },
  {
    question: 'What happens if the internet drops mid-exam?',
    answer:
      'Answers are queued locally and synchronized when the connection returns, using the attempt that the server already stored. Unsaved answers are never submitted silently, and a disconnection is never reported as misconduct.',
  },
  {
    question: 'Who can create a teacher or invigilator account?',
    answer:
      'Only an administrator. Public registration always creates a student, and the API refuses any attempt to supply a role. For local development a seed script creates one demo account per role.',
  },
  {
    question: 'Is email required to run the platform?',
    answer:
      'No. Email notifications are optional and only attempted when a mail provider is configured through environment variables. The app never reports an email as delivered unless a provider actually accepted it.',
  },
  {
    question: 'How is cheating detected?',
    answer:
      'It is not, and the platform does not pretend otherwise. Optional fullscreen and tab-visibility signals are stored as informational warnings. Identity verification, webcams and biometrics are explicitly out of scope.',
  },
  {
    question: 'Which question types are supported?',
    answer:
      'The MVP supports single-answer multiple choice and true/false questions. Multiple-answer questions, a reusable question bank and CSV import are planned stretch items. Free-text answers are out of scope for automatic grading.',
  },
];

export function FaqSection({ limit, className, heading = 'Questions, answered' }) {
  const items = typeof limit === 'number' ? FAQS.slice(0, limit) : FAQS;

  return (
    <section id="faq" className={cn('px-4 py-16 sm:px-6 lg:px-8', className)}>
      <div className="mx-auto w-full max-w-4xl">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{heading}</h2>
        <div className="mt-8 space-y-3">
          {items.map((faq) => (
            <details key={faq.question} className="glass group rounded-2xl px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-[var(--color-ink)]">
                {faq.question}
                <ChevronDown
                  className="size-4 shrink-0 text-[var(--color-ink-dim)] transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FaqSection;
