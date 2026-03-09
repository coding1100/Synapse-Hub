'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  Activity,
  Building2,
  ChevronRight,
  Hash,
  Home,
  MessageCircle,
  MessageCircleMore,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { getChannels } from '@/lib/queries';
import { useAuth } from '@/providers/auth-provider';
import { useWorkspace } from '@/providers/workspace-provider';
import { Channel } from '@/types';
import { WorkspaceSwitcher } from './workspace-switcher';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/channels', label: 'Channels', icon: Hash },
  { href: '/messages', label: 'Threads', icon: MessageCircleMore },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/workspace', label: 'People', icon: Building2 },
  { href: '/settings', label: 'Settings', icon: Settings2 },
  { href: '/admin', label: 'Admin', icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeChannelId = searchParams.get('channelId');
  const { user, isAuthenticated, isLoaded } = useAuth();
  const { selectedWorkspaceId } = useWorkspace();

  const directChannelQuery = useQuery({
    queryKey: ['channels', selectedWorkspaceId],
    queryFn: () => getChannels(selectedWorkspaceId!),
    enabled: Boolean(selectedWorkspaceId && isLoaded && isAuthenticated),
    retry: false,
    staleTime: 15_000,
  });

  const directChannels = useMemo(
    () => (directChannelQuery.data?.data ?? []).filter((channel) => channel.type === 'DIRECT'),
    [directChannelQuery.data],
  );

  return (
    <>
      <aside className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/95 px-2.5 py-2 backdrop-blur lg:hidden">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="inline-flex min-w-0 items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Sparkles size={14} />
            </span>
            <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">SynapseHub</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <Activity size={11} className="text-emerald-500" />
            Live
          </span>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-semibold transition',
                  isActive
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                <Icon size={13} className={isActive ? 'text-blue-600' : 'text-slate-500'} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <aside className="sticky top-0 hidden h-screen w-[16rem] flex-col border-r border-slate-200/90 bg-white px-3 py-3 lg:flex">
        <div className="border-b border-slate-200 px-1 pb-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Sparkles size={15} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">SynapseHub</p>
              <p className="text-sm font-bold text-slate-900">Team Space</p>
            </div>
          </div>
        </div>

        <div className="pt-3">
          <WorkspaceSwitcher />
        </div>

        <nav className="mt-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icon size={15} className={isActive ? 'text-white' : 'text-slate-500'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <section className="mt-4 min-h-0 flex-1 border-t border-slate-200 pt-3">
          <div className="mb-1 flex items-center justify-between px-0.5 py-1">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Direct Messages</h3>
            <Link
              href="/messages"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100"
              aria-label="Open messages"
              title="Open messages"
            >
              <MessageCircle size={13} />
            </Link>
          </div>

          <div className="min-h-0 space-y-1 overflow-y-auto">
            {directChannels.map((channel) => {
              const label = resolveDirectChannelLabel(channel, user?.id);
              const isActive = pathname === '/messages' && activeChannelId === channel.id;

              return (
                <Link
                  key={channel.id}
                  href={`/messages?channelId=${encodeURIComponent(channel.id)}`}
                  className={clsx(
                    'flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition',
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100',
                  )}
                >
                  <span className={clsx('inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold', avatarTone(channel.id))}>
                    {initials(label)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  <ChevronRight size={13} className={clsx(isActive ? 'text-blue-500' : 'text-slate-400')} />
                </Link>
              );
            })}

            {selectedWorkspaceId && !directChannelQuery.isLoading && directChannels.length === 0 && (
              <p className="rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-500">
                No DMs yet. Start one from Messages.
              </p>
            )}

            {!selectedWorkspaceId && (
              <p className="rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-500">
                Select workspace to load DMs.
              </p>
            )}
          </div>
        </section>

        <div className="mt-3 border-t border-slate-200 px-1 pt-3 text-xs text-slate-500">
          <p className="inline-flex items-center gap-1 font-semibold text-slate-600">
            <Activity size={12} className="text-emerald-500" />
            Realtime enabled
          </p>
          <p className="mt-1 truncate">Signed in as {user?.displayName ?? 'User'}</p>
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
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-violet-100 text-violet-700',
  ];

  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index)) % tones.length;
  }

  return tones[hash];
}
