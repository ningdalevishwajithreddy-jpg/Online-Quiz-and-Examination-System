import { Compass, Home, SearchX } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Card className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--color-danger)_14%,transparent)]">
            <SearchX className="size-7 text-[var(--color-danger)]" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">That page does not exist</h1>
          <p className="mx-auto mt-3 max-w-md text-[var(--color-ink-muted)]">
            The link may be outdated, or the page may have moved. Nothing was changed or lost.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/" icon={Home}>
              Back to home
            </Button>
            <Button to="/help" variant="secondary" icon={Compass}>
              Visit help
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
