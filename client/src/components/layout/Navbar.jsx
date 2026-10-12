import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { LayoutDashboard, LogIn, Menu, Sparkles, X } from 'lucide-react';

import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { StatusPill } from '../ui/StatusPill';
import SignOutButton from '../auth/SignOutButton';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';

const NAV_LINKS = [
  { label: 'Features', to: '/features' },
  { label: 'About', to: '/about' },
  { label: 'Help', to: '/help' },
  { label: 'Contact', to: '/contact' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Escape closes the mobile panel.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const linkClasses = ({ isActive }) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-white/8 text-[var(--color-ink)]'
        : 'text-[var(--color-ink-muted)] hover:bg-white/5 hover:text-[var(--color-ink)]',
    );

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-canvas)_82%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo size="md" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          <NavLink to="/" className={linkClasses} end>
            Home
          </NavLink>
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClasses}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <StatusPill showLabel={false} />
          {isAuthenticated ? (
            <>
              <span className="max-w-[10rem] truncate text-sm text-[var(--color-ink-muted)]">
                {user?.name}
              </span>
              <Button variant="secondary" size="sm" to="/dashboard" icon={LayoutDashboard}>
                Dashboard
              </Button>
              <SignOutButton size="sm" />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" to="/login" icon={LogIn}>
                Log in
              </Button>
              <Button variant="primary" size="sm" to="/register" icon={Sparkles}>
                Get started
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-xl p-2 text-[var(--color-ink-muted)] transition hover:bg-white/5 hover:text-[var(--color-ink)] lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {mobileOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </div>

      {mobileOpen ? (
        <div id="mobile-navigation" className="border-t border-[var(--color-line)] lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6" aria-label="Mobile">
            <NavLink to="/" className={linkClasses} end onClick={() => setMobileOpen(false)}>
              Home
            </NavLink>
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={linkClasses}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}

            <div className="mt-3 flex flex-col gap-2 border-t border-[var(--color-line)] pt-4">
              {isAuthenticated ? (
                <>
                  <Button variant="secondary" to="/dashboard" icon={LayoutDashboard} className="justify-center">
                    Dashboard
                  </Button>
                  <Button variant="secondary" to="/account" className="justify-center">
                    My account
                  </Button>
                  <SignOutButton className="justify-center" showLabel />
                </>
              ) : (
                <>
                  <Button variant="secondary" to="/login" icon={LogIn} className="justify-center">
                    Log in
                  </Button>
                  <Button variant="primary" to="/register" icon={Sparkles} className="justify-center">
                    Get started
                  </Button>
                </>
              )}
              <StatusPill className="mt-2 self-start" />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
