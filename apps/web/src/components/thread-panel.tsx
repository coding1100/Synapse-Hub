'use client';

import { Message } from '@/types';

export function ThreadPanel({
  rootMessage,
  replies,
}: {
  rootMessage: Message | null;
  replies: Message[];
}) {
  return (
    <aside className="h-full rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-panel">
      <h3 className="mb-3 font-display text-lg font-bold text-ink">Thread</h3>
      {!rootMessage && <p className="text-sm text-slate-500">Select a message to inspect thread replies.</p>}
      {rootMessage && (
        <>
          <div className="rounded-xl bg-mint p-3 text-sm text-slate-800">{rootMessage.content}</div>
          <div className="mt-3 space-y-2">
            {replies.map((reply) => (
              <div key={reply.id} className="rounded-xl bg-slate-50 p-2 text-sm text-slate-700">
                {reply.content}
              </div>
            ))}
            {replies.length === 0 && <p className="text-xs text-slate-500">No replies yet.</p>}
          </div>
        </>
      )}
    </aside>
  );
}