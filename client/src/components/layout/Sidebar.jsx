import { NavLink } from 'react-router';
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';

import { Logo } from '../ui/Logo';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';
import { NAV_SECTIONS } from '../../utils/navigation';
import { useAuth } from '../../context/AuthContext';

/**
 * Application sidebar.
 *
 * Collapses to icons on desktop and slides in as an overlay on mobile. Links
 * come from lib/navigation.js and only point at routes that exist.
 */

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { user, roleLabel } = useAuth();

  const renderLinks = (onNavigate) =>
    NAV_SECTIONS.map((section) => (
      <div key={section.heading} className="space-y-1">
        <p
          className={cn(
            'px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-dim)]',
            collapsed && 'lg:sr-only',
          )}
        >
          {section.heading}
        </p>
        {section.links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[color-mix(in_srgb,var(--color-brand-500)_20%,transparent)] text-[var(--color-ink)]'
                  : 'text-[var(--color-ink-muted)] hover:bg-white/5 hover:text-[var(--color-ink)]',
                collapsed && 'lg:justify-center lg:px-2',
              )
            }
            title={collapsed ? link.label : undefined}
          >
            <link.icon className="size-4.5 shrink-0" aria-hidden="true" />
            <span className={cn('truncate', collapsed && 'lg:sr-only')}>{link.label}</span>
          </NavLink>
        ))}
      </div>
    ));

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-[color-mix(in_srgb,var(--color-canvas)_72%,transparent)] backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      ) : null}

      <aside
        id="app-sidebar"
        aria-label="Application navigation"
        className={cn(
          'glass z-50 flex flex-col gap-6 rounded-none border-y-0 border-l-0 p-4 transition-all duration-300',
          'fixed inset-y-0 left-0 w-72 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'lg:w-[5.5rem]' : 'lg:w-72',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className={cn(collapsed && 'lg:sr-only')}>
            <Logo size="sm" />
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-2 text-[var(--color-ink-muted)] hover:bg-white/5 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-lg p-2 text-[var(--color-ink-muted)] transition hover:bg-white/5 hover:text-[var(--color-ink)] lg:inline-flex"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4.5" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-4.5" aria-hidden="true" />
            )}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto">{renderLinks(onCloseMobile)}</nav>

        <div className={cn('glass-soft rounded-2xl p-3', collapsed && 'lg:hidden')}>
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-[var(--color-ink-dim)]">{user?.email}</p>
          <Badge tone="brand" className="mt-2">
            {roleLabel || user?.role}
          </Badge>
        </div>
      </aside>
    </>
  );
}

