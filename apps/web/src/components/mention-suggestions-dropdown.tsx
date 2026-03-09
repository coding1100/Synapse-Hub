'use client';

import clsx from 'clsx';
import { AtSign, UserRound } from 'lucide-react';
import { MentionSuggestion } from '@/hooks/use-mention-suggestions';

export function MentionSuggestionsDropdown({
  suggestions,
  activeIndex,
  onSelect,
}: {
  suggestions: MentionSuggestion[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute -top-2 z-20 max-h-56 w-full -translate-y-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-panel">
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.id}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(index)}
          className={clsx(
            'flex w-full items-center gap-2 px-3 py-2 text-left transition',
            index === activeIndex ? 'bg-blue-50' : 'bg-white hover:bg-slate-50',
          )}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <UserRound size={14} />
          </span>
          <span className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{suggestion.displayName}</p>
            <p className="truncate text-xs text-slate-500">{suggestion.email}</p>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
            <AtSign size={11} />
            {suggestion.handle}
          </span>
        </button>
      ))}
    </div>
  );
}
