'use client';

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircleReply, SendHorizonal } from 'lucide-react';
import { Message } from '@/types';
import { useAuth } from '@/providers/auth-provider';
import { extractMentionContext, insertMention } from '@/lib/mentions';
import { useMentionSuggestions } from '@/hooks/use-mention-suggestions';
import { MessageCard } from './chat-primitives';
import { MentionSuggestionsDropdown } from './mention-suggestions-dropdown';

export function ThreadPanel({
  rootMessage,
  replies,
  isLoading,
  feedback,
  onReply,
  workspaceId,
}: {
  rootMessage: Message | null;
  replies: Message[];
  isLoading?: boolean;
  feedback?: string | null;
  onReply?: (content: string) => Promise<void>;
  workspaceId?: string | null;
}) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [caretPosition, setCaretPosition] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const mention = useMemo(() => extractMentionContext(content, caretPosition), [content, caretPosition]);

  const { suggestions } = useMentionSuggestions(workspaceId, mention?.query);
  const showSuggestions = Boolean(onReply && mention && suggestions.length > 0);

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

    const result = insertMention(content, mention, suggestion.handle);
    setContent(result.nextContent);
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

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
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
      void submitReply();
    }
  };

  const submitReply = async () => {
    if (!onReply || !content.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onReply(content.trim());
      setContent('');
      setCaretPosition(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await submitReply();
  };

  return (
    <aside className="flex h-full min-h-0 flex-col bg-transparent p-3 sm:p-4">
      <div className="mb-3">
        <h3 className="inline-flex items-center gap-2 text-xl font-bold text-ink sm:text-2xl">
          <MessageCircleReply size={20} className="text-blue-600" />
          Thread
        </h3>
        <p className="app-kicker mt-1">
          {rootMessage ? `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}` : 'Select a message'}
        </p>
      </div>

      {!rootMessage && (
        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
          Select a message in the channel timeline to open its thread.
        </div>
      )}

      {rootMessage && (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div>
            <p className="app-kicker mb-2">Root message</p>
            <MessageCard message={rootMessage} currentUserId={user?.id} tone="highlight" compact />
          </div>

          {feedback && (
            <p
              className={`text-xs font-semibold ${
                feedback.toLowerCase().includes('failed') || feedback.toLowerCase().includes('unable')
                  ? 'text-red-600'
                  : 'text-emerald-700'
              }`}
            >
              {feedback}
            </p>
          )}

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {isLoading && <p className="text-xs text-slate-500">Loading thread...</p>}
            {!isLoading &&
              replies.map((reply) => <MessageCard key={reply.id} message={reply} currentUserId={user?.id} compact />)}
            {!isLoading && replies.length === 0 && (
              <p className="text-xs text-slate-500">No replies yet. Be the first to reply.</p>
            )}
          </div>

          {onReply && (
            <form onSubmit={onSubmit} className="space-y-2 border-t border-slate-200 pt-3">
              <div className="relative">
                {showSuggestions && (
                  <MentionSuggestionsDropdown suggestions={suggestions} activeIndex={activeIndex} onSelect={applyMention} />
                )}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(event) => {
                    setContent(event.target.value);
                    syncCaret(event.target);
                  }}
                  onClick={(event) => syncCaret(event.target as HTMLTextAreaElement)}
                  onKeyUp={(event) => syncCaret(event.target as HTMLTextAreaElement)}
                  onSelect={(event) => syncCaret(event.target as HTMLTextAreaElement)}
                  onKeyDown={onComposerKeyDown}
                  rows={3}
                  placeholder="Reply in thread"
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white p-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:p-3"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:px-4 sm:py-2.5"
                >
                  <SendHorizonal size={14} />
                  {isSubmitting ? 'Sending...' : 'Reply'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </aside>
  );
}
