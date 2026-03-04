'use client';

import { useState } from 'react';

export function MessageComposer({
  onSend,
  disabled,
}: {
  onSend: (content: string) => void;
  disabled?: boolean;
}) {
  const [content, setContent] = useState('');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-panel">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Type a message..."
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-ocean focus:ring-2 focus:ring-ocean/20"
      />
      <div className="mt-3 flex justify-end">
        <button
          disabled={disabled || content.trim().length === 0}
          onClick={() => {
            if (!content.trim()) return;
            onSend(content.trim());
            setContent('');
          }}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Send
        </button>
      </div>
    </div>
  );
}