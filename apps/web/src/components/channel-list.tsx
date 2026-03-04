'use client';

import { Channel } from '@/types';
import clsx from 'clsx';

export function ChannelList({
  channels,
  selectedChannelId,
  onSelect,
}: {
  channels: Channel[];
  selectedChannelId?: string;
  onSelect: (channel: Channel) => void;
}) {
  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-panel">
      <h3 className="mb-3 font-display text-xl font-bold text-ink">Channels</h3>
      <div className="space-y-2">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onSelect(channel)}
            className={clsx(
              'w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition',
              selectedChannelId === channel.id
                ? 'bg-ocean text-white'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100',
            )}
          >
            # {channel.name}
          </button>
        ))}
        {channels.length === 0 && <p className="text-sm text-slate-500">No channels found.</p>}
      </div>
    </div>
  );
}