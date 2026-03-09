'use client';

import clsx from 'clsx';
import { Bookmark, Hash, MessageCircle, MessageSquareReply, Pin } from 'lucide-react';
import { Message } from '@/types';
import { useAuth } from '@/providers/auth-provider';
import {
  MentionText,
  MentionTextInverse,
  formatMessageTime,
  renderThreadCta,
  resolveSenderLabel,
} from './chat-primitives';

type TimelineItem =
  | {
      id: string;
      kind: 'day';
      label: string;
    }
  | {
      id: string;
      kind: 'message';
      message: Message;
    };

export function ChatWindow({
  messages,
  threadReplyCounts,
  activeChannelName,
  activeChannelType,
  onOpenThread,
  pinnedMessageIds,
  bookmarkedMessageIds,
  onTogglePin,
  onToggleBookmark,
}: {
  messages: Message[];
  threadReplyCounts?: Record<string, number>;
  activeChannelName?: string;
  activeChannelType?: 'PUBLIC' | 'PRIVATE' | 'DIRECT';
  onOpenThread: (message: Message) => void;
  pinnedMessageIds?: Set<string>;
  bookmarkedMessageIds?: Set<string>;
  onTogglePin?: (message: Message) => void;
  onToggleBookmark?: (message: Message) => void;
}) {
  const { user } = useAuth();

  const timeline = buildTimeline(messages);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-transparent">
      <header className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="min-w-0">
          <h3 className="inline-flex items-center gap-2 truncate text-lg font-bold text-ink sm:text-xl">
            {activeChannelType === 'DIRECT' ? (
              <MessageCircle size={18} className="text-blue-600" />
            ) : (
              <Hash size={18} className="text-blue-600" />
            )}
            <span className="truncate">{activeChannelName ?? 'Select conversation'}</span>
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {renderChannelTypeLabel(activeChannelType)} · {messages.length}{' '}
            {messages.length === 1 ? 'message' : 'messages'}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5 sm:px-4 sm:py-3">
        {timeline.map((item) => {
          if (item.kind === 'day') {
            return <DateSeparator key={item.id} label={item.label} />;
          }

          const message = item.message;
          return (
            <ConversationBubble
              key={item.id}
              message={message}
              currentUserId={user?.id}
              threadReplyCount={threadReplyCounts?.[message.id] ?? 0}
              onOpenThread={onOpenThread}
              isPinned={pinnedMessageIds?.has(message.id) ?? false}
              isBookmarked={bookmarkedMessageIds?.has(message.id) ?? false}
              onTogglePin={onTogglePin}
              onToggleBookmark={onToggleBookmark}
            />
          );
        })}

        {messages.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-500">
            No messages yet. Start the conversation.
          </div>
        )}
      </div>
    </section>
  );
}

function ConversationBubble({
  message,
  currentUserId,
  threadReplyCount,
  onOpenThread,
  isPinned,
  isBookmarked,
  onTogglePin,
  onToggleBookmark,
}: {
  message: Message;
  currentUserId?: string;
  threadReplyCount: number;
  onOpenThread: (message: Message) => void;
  isPinned: boolean;
  isBookmarked: boolean;
  onTogglePin?: (message: Message) => void;
  onToggleBookmark?: (message: Message) => void;
}) {
  const isCurrentUser = message.authorId === currentUserId;
  const sender = resolveSenderLabel(message, currentUserId);

  return (
    <article className={clsx('group flex w-full py-2', isCurrentUser ? 'justify-end' : 'justify-start')}>
      <div className={clsx('flex w-full max-w-[88%] items-end gap-2 sm:max-w-[74%]', isCurrentUser && 'flex-row-reverse')}>
        <div
          className={clsx(
            'mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold uppercase',
            isCurrentUser ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700',
          )}
        >
          {resolveSenderInitials(sender)}
        </div>

        <div className={clsx('min-w-0 flex-1', isCurrentUser && 'text-right')}>
          {!isCurrentUser && (
            <p className="mb-1 truncate text-xs font-semibold text-slate-600">{sender}</p>
          )}

          <div
            className={clsx(
              'inline-block max-w-full rounded-2xl px-3 py-2 text-left text-sm leading-relaxed',
              isCurrentUser
                ? 'rounded-br-md bg-blue-600 text-white'
                : 'rounded-bl-md bg-slate-100 text-slate-800',
            )}
          >
            {isCurrentUser ? (
              <MentionTextInverse content={message.content} />
            ) : (
              <MentionText content={message.content} />
            )}
          </div>

          <div className={clsx('mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500', isCurrentUser && 'justify-end')}>
            <time>{formatMessageTime(message.createdAt)}</time>
            <button
              type="button"
              onClick={() => onOpenThread(message)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-700"
            >
              <MessageSquareReply size={11} />
              {renderThreadCta(threadReplyCount)}
            </button>
            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(message)}
                className={clsx(
                  'inline-flex items-center gap-1 text-[11px] font-semibold',
                  isPinned ? 'text-amber-700' : 'text-slate-600 hover:text-slate-800',
                )}
              >
                <Pin size={11} />
                {isPinned ? 'Pinned' : 'Pin'}
              </button>
            )}
            {onToggleBookmark && (
              <button
                type="button"
                onClick={() => onToggleBookmark(message)}
                className={clsx(
                  'inline-flex items-center gap-1 text-[11px] font-semibold',
                  isBookmarked ? 'text-cyan-700' : 'text-slate-600 hover:text-slate-800',
                )}
              >
                <Bookmark size={11} />
                {isBookmarked ? 'Saved' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="my-2.5 flex items-center gap-2">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function buildTimeline(messages: Message[]): TimelineItem[] {
  const timeline: TimelineItem[] = [];
  let previousDayKey: string | null = null;

  for (const message of messages) {
    const dayKey = new Date(message.createdAt).toDateString();
    if (dayKey !== previousDayKey) {
      timeline.push({
        id: `day-${dayKey}`,
        kind: 'day',
        label: formatDayLabel(message.createdAt),
      });
      previousDayKey = dayKey;
    }

    timeline.push({
      id: message.id,
      kind: 'message',
      message,
    });
  }

  return timeline;
}

function resolveSenderInitials(label: string) {
  if (label === 'You') {
    return 'YO';
  }

  const words = label
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 'US';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function renderChannelTypeLabel(type?: 'PUBLIC' | 'PRIVATE' | 'DIRECT') {
  if (!type) {
    return 'Conversation';
  }

  if (type === 'DIRECT') {
    return 'Direct message';
  }

  return `${type.charAt(0)}${type.slice(1).toLowerCase()} channel`;
}

function formatDayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
}
