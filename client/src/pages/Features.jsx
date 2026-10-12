import FeaturesSection from '../components/home/FeaturesSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import RolesSection from '../components/home/RolesSection';
import TechStackSection from '../components/home/TechStackSection';
import CtaSection from '../components/home/CtaSection';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Features() {
  useDocumentTitle('Features');

  return (
    <>
      <section className="px-4 pt-14 pb-2 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-ink-dim)]">
            Capabilities
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            A complete examination workflow, not a demo shell
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--color-ink-muted)]">
            Every feature listed here maps to a REST endpoint, a MongoDB collection and an automated test. Where
            something is not implemented yet, the roadmap says so rather than pretending.
          </p>
        </div>
      </section>

      <FeaturesSection />
      <HowItWorksSection />
      <RolesSection />
      <TechStackSection />
      <CtaSection />
    </>
  );
}
