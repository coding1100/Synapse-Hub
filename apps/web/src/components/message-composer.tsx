'use client';

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AtSign, CalendarClock, CornerDownLeft, SendHorizonal } from 'lucide-react';
import { extractMentionContext, insertMention } from '@/lib/mentions';
import { useMentionSuggestions } from '@/hooks/use-mention-suggestions';
import { MentionSuggestionsDropdown } from './mention-suggestions-dropdown';

export function MessageComposer({
  onSend,
  onSchedule,
  value,
  onChange,
  disabled,
  workspaceId,
}: {
  onSend: (content: string) => Promise<void> | void;
  onSchedule?: (content: string, sendAt: string) => Promise<void> | void;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  workspaceId?: string | null;
}) {
  const [caretPosition, setCaretPosition] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');
  const [isSchedulePickerOpen, setIsSchedulePickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const mention = useMemo(
    () => extractMentionContext(value, caretPosition),
    [value, caretPosition],
  );

  const { suggestions } = useMentionSuggestions(workspaceId, mention?.query);
  const showSuggestions = Boolean(!disabled && mention && suggestions.length > 0);

  useEffect(() => {
    setActiveIndex(0);
  }, [mention?.query]);

  const applyMention = (index: number) => {
    if (!mention) {
      return;
    }

    const suggestion = suggestions[index];
    if (!suggestion) {
      return;
    }

    const result = insertMention(value, mention, suggestion.handle);
    onChange(result.nextContent);
    setCaretPosition(result.nextCaretPosition);

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(result.nextCaretPosition, result.nextCaretPosition);
    });
  };

  const syncCaret = (target: HTMLTextAreaElement) => {
    setCaretPosition(target.selectionStart ?? target.value.length);
  };

  const submitMessage = async () => {
    if (disabled || !value.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSend(value.trim());
      onChange('');
      setCaretPosition(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitScheduledMessage = async () => {
    if (!onSchedule || disabled || !value.trim() || !scheduleAt || isScheduling) {
      return;
    }

    setIsScheduling(true);
    try {
      await onSchedule(value.trim(), scheduleAt);
      onChange('');
      setScheduleAt('');
      setIsSchedulePickerOpen(false);
      setCaretPosition(0);
    } finally {
      setIsScheduling(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((previous) => (previous + 1) % suggestions.length);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((previous) => (previous - 1 + suggestions.length) % suggestions.length);
        return;
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        applyMention(activeIndex);
        return;
      }
    }

    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void submitMessage();
    }
  };

  const toggleSchedulePicker = () => {
    if (!onSchedule) {
      return;
    }

    setIsSchedulePickerOpen((open) => {
      const next = !open;
      if (next && !scheduleAt) {
        setScheduleAt(getDefaultScheduleDateTime());
      }
      return next;
    });
  };

  return (
    <div className="border-t border-app-line bg-app-panel px-0 pt-3 sm:pt-4">
      <div className="relative">
        {showSuggestions && (
          <MentionSuggestionsDropdown
            suggestions={suggestions}
            activeIndex={activeIndex}
            onSelect={applyMention}
          />
        )}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            syncCaret(event.target);
          }}
          onClick={(event) => syncCaret(event.target as HTMLTextAreaElement)}
          onKeyUp={(event) => syncCaret(event.target as HTMLTextAreaElement)}
          onSelect={(event) => syncCaret(event.target as HTMLTextAreaElement)}
          onKeyDown={onKeyDown}
          placeholder="Type a message"
          rows={3}
          className="w-full resize-none rounded-xl border border-app-line bg-app-soft p-2.5 text-sm text-app-ink outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/45 sm:p-3"
        />
      </div>

      <div className="mt-2.5 space-y-2.5 sm:mt-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-app-line bg-app-soft px-2 py-1 text-[11px] font-medium text-app-muted sm:text-xs">
              <AtSign size={12} />
              Mentions
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-app-line bg-app-soft px-2 py-1 text-[11px] font-medium text-app-muted sm:text-xs">
              <CornerDownLeft size={12} />
              Ctrl+Enter
            </span>
          </div>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            {onSchedule && (
              <button
                type="button"
                onClick={toggleSchedulePicker}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 rounded-xl border border-app-line bg-app-panel px-3 py-2 text-sm font-semibold text-app-ink transition hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:py-2.5"
              >
                <CalendarClock size={14} />
                {isSchedulePickerOpen ? 'Hide schedule' : 'Send later'}
              </button>
            )}
            <button
              disabled={disabled || value.trim().length === 0 || isSubmitting}
              onClick={() => {
                void submitMessage();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:px-4 sm:py-2.5"
            >
              <SendHorizonal size={14} />
              {isSubmitting ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>

        {onSchedule && isSchedulePickerOpen && (
          <div className="grid gap-2 border-t border-app-line pt-2.5 sm:grid-cols-[1fr_auto] sm:items-center">
            <label className="inline-flex w-full items-center gap-2 rounded-xl border border-app-line bg-app-soft px-2.5 py-2 text-xs text-app-muted">
              <CalendarClock size={14} className="text-app-muted" />
              <input
                type="datetime-local"
                value={scheduleAt}
                min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                onChange={(event) => setScheduleAt(event.target.value)}
                className="w-full bg-transparent text-app-ink outline-none"
              />
            </label>
            <button
              type="button"
              disabled={disabled || value.trim().length === 0 || !scheduleAt || isScheduling}
              onClick={() => {
                void submitScheduledMessage();
              }}
              className="inline-flex items-center justify-center rounded-xl border border-app-line bg-app-panel px-3 py-2 text-sm font-semibold text-app-ink transition hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-60 sm:py-2.5"
            >
              {isScheduling ? 'Scheduling...' : 'Schedule message'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getDefaultScheduleDateTime() {
  const nextHour = new Date();
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  return nextHour.toISOString().slice(0, 16);
}
