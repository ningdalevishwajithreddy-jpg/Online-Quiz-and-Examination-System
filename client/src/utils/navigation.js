import { Gauge, UserCircle2 } from 'lucide-react';

/**
 * Sidebar navigation.
 *
 * Only routes that exist are listed, so a user is never sent to an unfinished
 * screen. New areas are appended here as their phases land.
 */
export const NAV_SECTIONS = [
  {
    heading: 'Overview',
    links: [
      { label: 'Dashboard', to: '/dashboard', icon: Gauge },
      { label: 'My account', to: '/account', icon: UserCircle2 },
    ],
  },
];
