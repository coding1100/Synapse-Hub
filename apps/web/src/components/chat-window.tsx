'use client';

import { Message } from '@/types';

export function ChatWindow({
  messages,
  activeChannelName,
  onOpenThread,
}: {
  messages: Message[];
  activeChannelName?: string;
  onOpenThread: (message: Message) => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white/95 shadow-panel">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="font-display text-lg font-bold text-ink">#{activeChannelName ?? 'Select channel'}</h3>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <div key={message.id} className="rounded-xl bg-slate-50 px-3 py-3 animate-riseIn">
            <div className="mb-1 flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>{message.authorId}</span>
              <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
            </div>
            <p className="text-sm text-slate-800">{message.content}</p>
            <button
              onClick={() => onOpenThread(message)}
              className="mt-2 text-xs font-semibold text-ocean hover:underline"
            >
              Open thread
            </button>
          </div>
        ))}
        {messages.length === 0 && <p className="text-sm text-slate-500">No messages yet.</p>}
      </div>
    </div>
  );
}