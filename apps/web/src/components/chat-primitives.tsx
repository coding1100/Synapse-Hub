'use client';

import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Bookmark, MessageSquareReply, Pin } from 'lucide-react';
import { Message } from '@/types';

export function MessageCard({
  message,
  currentUserId,
  onOpenThread,
  threadReplyCount = 0,
  tone = 'default',
  compact = false,
  isPinned = false,
  isBookmarked = false,
  onTogglePin,
  onToggleBookmark,
}: {
  message: Message;
  currentUserId?: string;
  onOpenThread?: (message: Message) => void;
  threadReplyCount?: number;
  tone?: 'default' | 'highlight';
  compact?: boolean;
  isPinned?: boolean;
  isBookmarked?: boolean;
  onTogglePin?: (message: Message) => void;
  onToggleBookmark?: (message: Message) => void;
}) {
  const sender = resolveSenderLabel(message, currentUserId);
  const initials = resolveSenderInitials(sender);
  const isCurrentUser = message.authorId === currentUserId;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={clsx(
        'group flex gap-2.5 border-b border-app-line px-0 py-2.5 transition last:border-b-0 sm:gap-3 sm:py-3',
        compact ? 'py-2 sm:py-2.5' : 'py-2.5 sm:py-3',
        tone === 'highlight'
          ? 'bg-emerald-50/65 dark:bg-emerald-500/15'
          : isCurrentUser
            ? 'bg-indigo-50/70 dark:bg-indigo-500/14'
            : 'bg-transparent',
      )}
    >
      <div
        className={clsx(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold uppercase sm:h-8 sm:w-8 sm:text-xs',
          tone === 'highlight'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
            : isCurrentUser
              ? 'bg-indigo-600 text-white dark:bg-indigo-500'
              : 'bg-app-soft text-app-muted',
        )}
      >
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-xs font-semibold text-app-ink sm:text-sm">{sender}</p>
            {isCurrentUser && (
              <span className="rounded-full border border-indigo-200 bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-200">
                You
              </span>
            )}
          </div>
          <time className="shrink-0 text-xs font-medium text-app-muted">{formatMessageTime(message.createdAt)}</time>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-app-ink">
          <MentionText content={message.content} />
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
          {onOpenThread && (
            <button
              type="button"
              onClick={() => onOpenThread(message)}
              className="inline-flex items-center gap-1 rounded-full border border-app-line bg-app-soft px-2.5 py-1 text-xs font-semibold text-app-muted transition hover:bg-app-hover"
            >
              <MessageSquareReply size={12} />
              {renderThreadCta(threadReplyCount)}
            </button>
          )}
          {onTogglePin && (
            <button
              type="button"
              onClick={() => onTogglePin(message)}
              className={clsx(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition',
                isPinned
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:hover:bg-amber-500/30'
                  : 'border border-app-line bg-app-soft text-app-muted hover:bg-app-hover',
              )}
            >
              <Pin size={12} />
              {isPinned ? 'Pinned' : 'Pin'}
            </button>
          )}
          {onToggleBookmark && (
            <button
              type="button"
              onClick={() => onToggleBookmark(message)}
              className={clsx(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition',
                isBookmarked
                  ? 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-200 dark:hover:bg-cyan-500/30'
                  : 'border border-app-line bg-app-soft text-app-muted hover:bg-app-hover',
              )}
            >
              <Bookmark size={12} />
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function MentionText({ content }: { content: string }) {
  const parts = content.split(/(@[a-zA-Z0-9._-]{2,64})/g);

  return parts.map((part, index) => {
    if (/^@[a-zA-Z0-9._-]{2,64}$/.test(part)) {
      return (
        <span key={`mention-${index}`} className="font-semibold text-indigo-600 dark:text-indigo-300">
          {part}
        </span>
      );
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
}

export function MentionTextInverse({ content }: { content: string }) {
  const parts = content.split(/(@[a-zA-Z0-9._-]{2,64})/g);

  return parts.map((part, index) => {
    if (/^@[a-zA-Z0-9._-]{2,64}$/.test(part)) {
      return (
        <span key={`mention-${index}`} className="font-semibold text-blue-100">
          {part}
        </span>
      );
    }

    return <span key={`text-${index}`}>{part}</span>;
  });
}

export function resolveSenderLabel(message: Message, currentUserId?: string) {
  if (message.authorId === currentUserId) {
    return 'You';
  }

  const displayName = message.author?.displayName?.trim();
  if (displayName) {
    return displayName;
  }

  const email = message.author?.email?.trim();
  if (email) {
    return email;
  }

  if (message.authorId.length <= 20) {
    return message.authorId;
  }

  return `${message.authorId.slice(0, 8)}...`;
}

export function renderThreadCta(replyCount: number) {
  if (replyCount <= 0) {
    return 'Open thread';
  }

  return `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`;
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

export function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
