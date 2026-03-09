'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Hash, Lock, MessageCircleMore, Plus, Search } from 'lucide-react';
import { Channel } from '@/types';
import { useAuth } from '@/providers/auth-provider';

export function ChannelList({
  channels,
  selectedChannelId,
  onSelect,
  onComposeDirectMessage,
}: {
  channels: Channel[];
  selectedChannelId?: string;
  onSelect: (channel: Channel) => void;
  onComposeDirectMessage?: () => void;
}) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');

  const filteredChannels = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return channels;
    }

    return channels.filter((channel) => {
      const label = resolveChannelLabel(channel, user?.id).toLowerCase();
      const topic = (channel.topic ?? '').toLowerCase();
      return label.includes(normalized) || topic.includes(normalized);
    });
  }, [channels, query, user?.id]);

  const grouped = useMemo(
    () => ({
      channels: filteredChannels.filter((channel) => channel.type !== 'DIRECT'),
      directMessages: filteredChannels.filter((channel) => channel.type === 'DIRECT'),
    }),
    [filteredChannels],
  );

  return (
    <aside className="flex h-full min-h-0 flex-col bg-transparent">
      <header className="border-b border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Conversations</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {filteredChannels.length}
          </span>
        </div>
        <label className="inline-flex w-full items-center gap-2 border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-500">
          <Search size={14} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations"
            className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ConversationSection
          title="Channels"
          items={grouped.channels}
          selectedChannelId={selectedChannelId}
          currentUserId={user?.id}
          onSelect={onSelect}
        />
        <ConversationSection
          title="Direct messages"
          items={grouped.directMessages}
          selectedChannelId={selectedChannelId}
          currentUserId={user?.id}
          onSelect={onSelect}
          showComposeAction={Boolean(onComposeDirectMessage)}
          onComposeDirectMessage={onComposeDirectMessage}
        />

        {filteredChannels.length === 0 && (
          <p className="px-3 py-3 text-sm text-slate-500 sm:px-4">No conversations found.</p>
        )}
      </div>
    </aside>
  );
}

function ConversationSection({
  title,
  items,
  selectedChannelId,
  currentUserId,
  onSelect,
  showComposeAction = false,
  onComposeDirectMessage,
}: {
  title: string;
  items: Channel[];
  selectedChannelId?: string;
  currentUserId?: string;
  onSelect: (channel: Channel) => void;
  showComposeAction?: boolean;
  onComposeDirectMessage?: () => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-slate-200 last:border-b-0">
      <header className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {title}
        </p>
        {showComposeAction && onComposeDirectMessage && (
          <button
            type="button"
            onClick={onComposeDirectMessage}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Start new direct message"
          >
            <Plus size={14} />
          </button>
        )}
      </header>

      <div>
        {items.map((channel) => {
          const label = resolveChannelLabel(channel, currentUserId);
          const selected = selectedChannelId === channel.id;

          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => onSelect(channel)}
              disabled={channel.isArchived}
              className={clsx(
                'flex w-full items-center gap-2.5 border-t border-slate-100 px-3 py-2.5 text-left transition first:border-t-0 sm:px-4',
                selected ? 'bg-blue-50/60' : 'hover:bg-slate-50/80',
                channel.isArchived && 'cursor-not-allowed opacity-65',
              )}
            >
              <div
                className={clsx(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold uppercase',
                  selected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700',
                )}
              >
                {resolveChannelAvatar(label, channel.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-800">{label}</p>
                  <time className="shrink-0 text-[11px] text-slate-500">
                    {formatConversationTime(channel.createdAt)}
                  </time>
                </div>
                <p className="truncate text-xs text-slate-500">
                  {resolveChannelSubtitle(channel)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function resolveChannelLabel(channel: Channel, currentUserId?: string) {
  if (channel.type !== 'DIRECT') {
    return channel.name;
  }

  const counterpart = channel.members?.find((member) => member.userId !== currentUserId)?.user;
  if (counterpart?.displayName?.trim()) {
    return counterpart.displayName;
  }

  if (counterpart?.email?.trim()) {
    return counterpart.email;
  }

  return 'Direct message';
}

function resolveChannelAvatar(label: string, type: Channel['type']) {
  if (type === 'DIRECT') {
    return initialsFromLabel(label);
  }

  if (type === 'PRIVATE') {
    return <Lock size={13} />;
  }

  if (type === 'PUBLIC') {
    return <Hash size={13} />;
  }

  return <MessageCircleMore size={13} />;
}

function resolveChannelSubtitle(channel: Channel) {
  if (channel.isArchived) {
    return 'Archived conversation';
  }

  if (channel.type === 'DIRECT') {
    return 'Direct conversation';
  }

  if (channel.topic?.trim()) {
    return channel.topic;
  }

  return channel.type === 'PRIVATE' ? 'Private channel' : 'Team channel';
}

function initialsFromLabel(label: string) {
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

function formatConversationTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
}
