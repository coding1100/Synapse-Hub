'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  ChevronRight,
  Hash,
  Home,
  MessageCircle,
  Search,
  Settings2,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { getChannels } from '@/lib/queries';
import { useAuth } from '@/providers/auth-provider';
import { useWorkspace } from '@/providers/workspace-provider';
import { Channel } from '@/types';
import { WorkspaceSwitcher } from './workspace-switcher';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/channels', label: 'Channels', icon: Hash },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/workspace', label: 'Team', icon: UsersRound },
  { href: '/settings', label: 'Settings', icon: Settings2 },
  { href: '/admin', label: 'Admin', icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeChannelId = searchParams.get('channelId');
  const { user, isAuthenticated, isLoaded } = useAuth();
  const { selectedWorkspaceId } = useWorkspace();

  const channelsQuery = useQuery({
    queryKey: ['channels', selectedWorkspaceId],
    queryFn: () => getChannels(selectedWorkspaceId!),
    enabled: Boolean(selectedWorkspaceId && isLoaded && isAuthenticated),
    retry: false,
    staleTime: 12_000,
  });

  const directChannels = useMemo(
    () => (channelsQuery.data?.data ?? []).filter((channel) => channel.type === 'DIRECT').slice(0, 8),
    [channelsQuery.data],
  );

  return (
    <>
      <aside className="sticky top-0 z-20 border-b border-app-line bg-app-panel px-3 py-2 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2">
            <span className="app-logo-mark">S</span>
            <p className="text-sm font-semibold text-app-ink">SynapseHub</p>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {navItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs font-semibold',
                    active
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/70 dark:bg-indigo-500/20 dark:text-indigo-200'
                      : 'border-app-line bg-app-panel text-app-muted',
                  )}
                >
                  <Icon size={12} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <aside className="hidden h-screen w-[264px] shrink-0 border-r border-app-line bg-app-panel px-3 py-3 lg:flex lg:flex-col">
        <div className="app-panel-soft flex items-center gap-2 px-3 py-2.5">
          <span className="app-logo-mark">S</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-app-muted">SynapseHub</p>
            <p className="text-sm font-semibold text-app-ink">Main Workspace</p>
          </div>
        </div>

        <div className="app-panel-soft mt-3 p-2.5">
          <WorkspaceSwitcher />
        </div>

        <nav className="app-panel-soft mt-3 space-y-0.5 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                    : 'text-app-muted hover:bg-app-hover hover:text-app-ink',
                )}
              >
                <Icon size={15} className={active ? 'text-white' : 'text-app-muted'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <section className="app-panel-soft mt-3 min-h-0 flex-1 p-2.5">
          <div className="mb-2 flex items-center justify-between px-0.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.13em] text-app-muted">
              Direct Messages
            </h3>
            <Link
              href="/messages"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-app-muted transition hover:bg-app-hover"
              aria-label="Open messages"
            >
              <MessageCircle size={13} />
            </Link>
          </div>

          <div className="min-h-0 space-y-1 overflow-y-auto pr-1">
            {directChannels.map((channel) => {
              const label = resolveDirectChannelLabel(channel, user?.id);
              const active = pathname === '/messages' && activeChannelId === channel.id;

              return (
                <Link
                  key={channel.id}
                  href={`/messages?channelId=${encodeURIComponent(channel.id)}`}
                  className={clsx(
                    'flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition',
                    active
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200'
                      : 'text-app-ink hover:bg-app-hover',
                  )}
                >
                  <span className={clsx('inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold', avatarTone(channel.id))}>
                    {initials(label)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  <ChevronRight size={13} className={active ? 'text-indigo-500' : 'text-app-muted'} />
                </Link>
              );
            })}

            {selectedWorkspaceId && !channelsQuery.isLoading && directChannels.length === 0 && (
              <p className="rounded-lg border border-app-line bg-app-soft px-2.5 py-2 text-xs text-app-muted">
                No direct messages yet.
              </p>
            )}

            {!selectedWorkspaceId && (
              <p className="rounded-lg border border-app-line bg-app-soft px-2.5 py-2 text-xs text-app-muted">
                Select workspace to load DMs.
              </p>
            )}
          </div>
        </section>

        <div className="mt-3 border-t border-app-line px-1 pt-3">
          <p className="truncate text-xs text-app-muted">Signed in as {user?.displayName ?? 'User'}</p>
        </div>
      </aside>
    </>
  );
}

function resolveDirectChannelLabel(channel: Channel, currentUserId?: string) {
  const counterpart = channel.members?.find((member) => member.userId !== currentUserId)?.user;
  if (counterpart?.displayName?.trim()) {
    return counterpart.displayName;
  }

  if (counterpart?.email?.trim()) {
    return counterpart.email;
  }

  return 'Direct message';
}

function initials(label: string) {
  const words = label
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 'DM';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function avatarTone(seed: string) {
  const tones = [
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
    'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200',
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i)) % tones.length;
  }

  return tones[hash];
}
