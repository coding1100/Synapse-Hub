'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WorkspaceSwitcher } from './workspace-switcher';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/workspace', label: 'Workspace' },
  { href: '/channels', label: 'Channels' },
  { href: '/messages', label: 'Messages' },
  { href: '/search', label: 'Search' },
  { href: '/settings', label: 'Settings' },
  { href: '/admin', label: 'Admin' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-72 flex-col gap-6 border-r border-slate-200 bg-white/80 px-5 py-6 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">SynapseHub</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-ink">Control Deck</h2>
      </div>
      <WorkspaceSwitcher />
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'rounded-xl px-3 py-2 text-sm font-semibold transition',
              pathname === item.href
                ? 'bg-ocean text-white shadow'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}