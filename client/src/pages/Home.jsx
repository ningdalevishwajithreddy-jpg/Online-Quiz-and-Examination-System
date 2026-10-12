import { CalendarClock, ClipboardList, Download, Trophy } from 'lucide-react';

import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import RolesSection from '../components/home/RolesSection';
import SecuritySection from '../components/home/SecuritySection';
import TechStackSection from '../components/home/TechStackSection';
import FaqSection from '../components/home/FaqSection';
import CtaSection from '../components/home/CtaSection';
import { Card } from '../components/ui/Card';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const STATS = [
  { icon: ClipboardList, label: 'Question types in MVP', value: 'MCQ + True/False' },
  { icon: CalendarClock, label: 'Timing authority', value: 'Server deadline' },
  { icon: Trophy, label: 'Grading', value: 'Automatic, idempotent' },
  { icon: Download, label: 'Reports', value: 'CSV exports' },
];

export default function Home() {
  useDocumentTitle();

  return (
    <>
      <HeroSection />

      <section className="px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <Card key={stat.label} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5">
                <stat.icon className="size-5 text-[var(--color-accent-400)]" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{stat.value}</p>
                <p className="truncate text-xs text-[var(--color-ink-dim)]">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <FeaturesSection />
      <HowItWorksSection />
      <RolesSection />
      <SecuritySection />
      <TechStackSection />
      <FaqSection limit={5} />
      <CtaSection />
    </>
  );
}
