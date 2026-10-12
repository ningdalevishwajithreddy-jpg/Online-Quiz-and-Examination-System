import { ArrowRight, LogIn } from 'lucide-react';

import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

export function CtaSection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="px-4 pb-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="glass relative overflow-hidden rounded-[var(--radius-card)] px-6 py-12 text-center sm:px-12">
          <div
            className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--color-brand-500)_28%,transparent)] blur-3xl"
            aria-hidden="true"
          />
          <h2 className="relative text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to run your next examination?
          </h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-[var(--color-ink-muted)]">
            Create a student account in seconds, or sign in with a demo account to explore the platform with real
            data.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            {isAuthenticated ? (
              <Button size="lg" to="/dashboard" iconRight={ArrowRight}>
                Go to dashboard
              </Button>
            ) : (
              <>
                <Button size="lg" to="/register" icon={ArrowRight}>
                  Get started free
                </Button>
                <Button size="lg" variant="secondary" to="/login" icon={LogIn}>
                  Log in
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CtaSection;
