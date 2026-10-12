import { useState } from 'react';
import { Menu, UserCircle2 } from 'lucide-react';

import { Sidebar } from '../components/layout/Sidebar';
import { NAV_SECTIONS } from '../utils/navigation';
import SignOutButton from '../components/auth/SignOutButton';
import { StatusPill } from '../components/ui/StatusPill';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

/**
 * Shell for signed-in pages: collapsible sidebar, top bar with the live
 * platform status and the account actions.
 */
export function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, roleLabel } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div className="flex min-h-screen">
      <Sidebar
        collapsed={collapsed && isDesktop}
        onToggleCollapse={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-canvas)_85%,transparent)] backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl p-2 text-[var(--color-ink-muted)] transition hover:bg-white/5 hover:text-[var(--color-ink)] lg:hidden"
              aria-label="Open navigation"
              aria-controls="app-sidebar"
              aria-expanded={mobileOpen}
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>

            <div className="hidden items-center gap-2 text-sm text-[var(--color-ink-dim)] sm:flex">
              <span>{NAV_SECTIONS[0].heading}</span>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <StatusPill className="hidden sm:inline-flex" pollMs={60000} />
              <span className="hidden items-center gap-2 text-sm text-[var(--color-ink-muted)] md:inline-flex">
                <UserCircle2 className="size-4" aria-hidden="true" />
                {user?.name}
                <Badge tone="brand">{roleLabel || user?.role}</Badge>
              </span>
              <SignOutButton size="sm" variant="secondary" />
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
