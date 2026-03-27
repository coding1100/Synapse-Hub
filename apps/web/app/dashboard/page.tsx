'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  BellDot,
  Bot,
  CalendarClock,
  MessageSquare,
  SearchCheck,
  UsersRound,
  Workflow,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { getChannels, getWorkspaces } from '@/lib/queries';
import { useWorkspace } from '@/providers/workspace-provider';

const pulseMembers = ['Ali', 'Boris', 'Nicolina', 'Joana', 'Floriko', 'Gaspar', 'Sudanka'];

export default function DashboardPage() {
  const { selectedWorkspace, selectedWorkspaceId } = useWorkspace();
  const { data, isError } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
    retry: false,
  });

  const channelsQuery = useQuery({
    queryKey: ['channels', selectedWorkspaceId],
    queryFn: () => getChannels(selectedWorkspaceId!),
    enabled: Boolean(selectedWorkspaceId),
    retry: false,
  });

  const workspaceCount = data?.data.length ?? 0;
  const channelCount = selectedWorkspaceId ? channelsQuery.data?.data.length ?? 0 : 0;
  const topChannels = useMemo(
    () => (channelsQuery.data?.data ?? []).slice(0, 3).map((channel) => channel.name),
    [channelsQuery.data],
  );

  const pulseRows = [
    {
      title: 'Standup in 20 min',
      subtitle: 'Engineering sync',
      body: 'Auto-reminder sent to #general and project channels.',
      icon: <CalendarClock size={14} className="text-blue-600" />,
    },
    {
      title: 'Mentions pending',
      subtitle: '9 unread',
      body: 'Review direct mentions and thread replies before sprint handoff.',
      icon: <BellDot size={14} className="text-amber-600" />,
    },
    {
      title: 'Bot digest',
      subtitle: 'Ops assistant',
      body: 'No incidents. 2 deploys completed and 1 scheduled send pending.',
      icon: <Bot size={14} className="text-emerald-600" />,
    },
    {
      title: 'Top channels',
      subtitle: topChannels.length > 0 ? topChannels.join(' | ') : 'No channels yet',
      body: 'Use focused channels to keep context clean and discoverable.',
      icon: <BarChart3 size={14} className="text-violet-600" />,
    },
  ];

  return (
    <AppShell title="Dashboard">
      <section className="app-panel p-4 sm:p-5">
        <div>
          <p className="app-kicker">Workspace pulse</p>
          <h2 className="mt-1 text-3xl font-bold text-app-ink">
            {selectedWorkspace ? `Hello, welcome to ${selectedWorkspace.name}` : 'Select a workspace to get started'}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-app-muted">
            Track collaboration health, surface conversations quickly, and keep the team aligned.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="app-chip">Realtime messaging</span>
          <span className="app-chip">DM + Channels</span>
          <span className="app-chip">Threads + Mentions</span>
          <span className="app-chip">Automation ready</span>
        </div>

        <div className="app-panel-soft mt-4 overflow-hidden">
          <div className="grid divide-y divide-app-line md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
            <MetricRow
              title="Workspaces"
              value={String(workspaceCount)}
              hint={isError ? 'Unable to load workspace count.' : 'Active teams in your account'}
              icon={<UsersRound size={17} className="text-blue-600" />}
            />
            <MetricRow
              title="Channels"
              value={selectedWorkspaceId ? String(channelCount) : '-'}
              hint={selectedWorkspaceId ? 'In selected workspace' : 'Choose workspace to load channels'}
              icon={<MessageSquare size={17} className="text-blue-600" />}
            />
            <MetricRow
              title="Search readiness"
              value="Online"
              hint="Messages, users, channels, and files"
              icon={<SearchCheck size={17} className="text-blue-600" />}
            />
            <MetricRow
              title="Automation"
              value="Ready"
              hint="Bots and integration endpoints available"
              icon={<Workflow size={17} className="text-blue-600" />}
            />
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="app-panel p-4 sm:p-5">
          <h3 className="text-xl font-bold text-app-ink">Team pulse</h3>
          <p className="mt-1 text-sm text-app-muted">Quick glance at who is active and what needs attention.</p>

          <div className="mt-4 flex flex-wrap gap-3">
            {pulseMembers.map((member) => (
              <div key={member} className="flex flex-col items-center gap-1">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-app-line bg-app-soft text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  {member.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-[11px] font-semibold text-app-muted">{member}</span>
              </div>
            ))}
          </div>

          <div className="app-panel-soft mt-4 overflow-hidden">
            {pulseRows.map((row) => (
              <article key={row.title} className="border-b border-app-line p-3 last:border-b-0">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-app-ink">
                  {row.icon}
                  {row.title}
                </p>
                <p className="mt-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">{row.subtitle}</p>
                <p className="mt-1 text-xs text-app-muted">{row.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="app-panel p-4 sm:p-5">
          <h3 className="text-xl font-bold text-app-ink">Action center</h3>
          <p className="mt-1 text-sm text-app-muted">Jump into core collaboration tasks.</p>

          <div className="app-panel-soft mt-4 overflow-hidden">
            <ActionRow href="/messages" title="Open messages" subtitle="Continue channel and DM conversations" />
            <ActionRow href="/workspace" title="Manage members" subtitle="Invite teammates and assign roles" />
            <ActionRow href="/channels" title="Create channels" subtitle="Structure by product area or stream" />
            <ActionRow href="/search" title="Search knowledge" subtitle="Find messages, users, files, and channels" />
            <ActionRow href="/admin" title="Configure automations" subtitle="Set up bots and secure integrations" />
          </div>

          <div className="mt-4 app-muted-box">
            <p className="app-kicker">Current context</p>
            <p className="mt-1 text-sm font-semibold text-app-ink">
              {selectedWorkspace?.name ?? 'No workspace selected'}
            </p>
            <p className="text-xs text-app-muted">{selectedWorkspace?.slug ?? '-'}</p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function MetricRow({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-app-muted">{title}</p>
        {icon}
      </div>
      <p className="mt-2 text-4xl font-bold text-app-ink">{value}</p>
      <p className="mt-1 text-xs text-app-muted">{hint}</p>
    </div>
  );
}

function ActionRow({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href} className="block border-b border-app-line px-3 py-3 transition hover:bg-app-hover last:border-b-0">
      <p className="text-sm font-semibold text-app-ink">{title}</p>
      <p className="text-xs text-app-muted">{subtitle}</p>
    </Link>
  );
}
