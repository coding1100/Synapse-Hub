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
    <div className="app-panel absolute -top-2 z-20 max-h-56 w-full -translate-y-full overflow-y-auto shadow-[0_16px_34px_rgba(2,8,23,0.28)]">
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.id}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(index)}
          className={clsx(
            'flex w-full items-center gap-2 px-3 py-2 text-left transition',
            index === activeIndex ? 'bg-indigo-50 dark:bg-indigo-500/20' : 'bg-app-panel hover:bg-app-hover',
          )}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-app-soft text-app-muted">
            <UserRound size={14} />
          </span>
          <span className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-app-ink">{suggestion.displayName}</p>
            <p className="truncate text-xs text-app-muted">{suggestion.email}</p>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
            <AtSign size={11} />
            {suggestion.handle}
          </span>
        </button>
      ))}
    </div>
  );
}
