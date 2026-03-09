'use client';

import clsx from 'clsx';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, CalendarClock, Pin, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { ChannelList } from '@/components/channel-list';
import { ChatWindow } from '@/components/chat-window';
import { MessageComposer } from '@/components/message-composer';
import { ThreadPanel } from '@/components/thread-panel';
import { apiClient } from '@/lib/api-client';
import { resolveApiError } from '@/lib/http-error';
import {
  cancelScheduledMessage,
  createBookmark,
  createDirectChannel,
  createThread,
  deleteBookmark,
  getBookmarks,
  getChannelPins,
  getChannels,
  getDrafts,
  getMessages,
  getScheduledMessages,
  getThread,
  getWorkspaceMembers,
  pinMessage,
  replyToThread,
  scheduleMessage,
  unpinMessage,
  upsertDraft,
} from '@/lib/queries';
import { useAuth } from '@/providers/auth-provider';
import { useWorkspace } from '@/providers/workspace-provider';
import { Channel, Message, ScheduledMessage } from '@/types';
import { useRealtime } from '@/hooks/use-realtime';

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm font-semibold text-slate-600">
          Loading messages...
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedChannelId = searchParams.get('channelId');
  const requestedChannelAppliedRef = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const { accessToken, user } = useAuth();
  const { selectedWorkspaceId: workspaceId } = useWorkspace();
  const [composerFeedback, setComposerFeedback] = useState<string | null>(null);
  const [threadFeedback, setThreadFeedback] = useState<string | null>(null);
  const [composerContent, setComposerContent] = useState('');
  const [draftHydratedChannelId, setDraftHydratedChannelId] = useState<string | null>(null);
  const [isDmComposerOpen, setIsDmComposerOpen] = useState(false);
  const [dmSearchTerm, setDmSearchTerm] = useState('');
  const [activeDmIndex, setActiveDmIndex] = useState(0);
  const [showUtilities, setShowUtilities] = useState(false);
  const [activeUtilityTab, setActiveUtilityTab] = useState<'PINNED' | 'BOOKMARKS' | 'SCHEDULED'>(
    'PINNED',
  );
  const draftErrorRef = useRef<string | null>(null);

  const channelQuery = useQuery({
    queryKey: ['channels', workspaceId],
    queryFn: () => getChannels(workspaceId!),
    enabled: Boolean(workspaceId),
    retry: false,
  });

  const channels = useMemo(() => channelQuery.data?.data ?? [], [channelQuery.data]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  useEffect(() => {
    if (channels.length === 0) {
      setSelectedChannel(null);
      return;
    }

    if (requestedChannelId && requestedChannelAppliedRef.current !== requestedChannelId) {
      const requestedChannel = channels.find((channel) => channel.id === requestedChannelId);
      if (requestedChannel) {
        setSelectedChannel(requestedChannel);
        requestedChannelAppliedRef.current = requestedChannelId;
        return;
      }
    }

    const currentChannelExists = selectedChannel
      ? channels.some((channel) => channel.id === selectedChannel.id)
      : false;

    if (!currentChannelExists) {
      setSelectedChannel(channels[0]);
    }
  }, [channels, requestedChannelId, selectedChannel]);

  const messageQuery = useQuery({
    queryKey: ['messages', selectedChannel?.id],
    queryFn: () => getMessages(selectedChannel!.id),
    enabled: Boolean(selectedChannel?.id),
    retry: false,
  });

  const pinsQuery = useQuery({
    queryKey: ['pins', selectedChannel?.id],
    queryFn: () => getChannelPins(selectedChannel!.id),
    enabled: Boolean(selectedChannel?.id),
    retry: false,
  });

  const bookmarksQuery = useQuery({
    queryKey: ['bookmarks', workspaceId, selectedChannel?.id],
    queryFn: () => getBookmarks(workspaceId!, selectedChannel?.id),
    enabled: Boolean(workspaceId && selectedChannel?.id),
    retry: false,
  });

  const draftsQuery = useQuery({
    queryKey: ['drafts', workspaceId, selectedChannel?.id],
    queryFn: () => getDrafts(workspaceId!, selectedChannel?.id),
    enabled: Boolean(workspaceId && selectedChannel?.id),
    retry: false,
  });

  const membersQuery = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => getWorkspaceMembers(workspaceId!),
    enabled: Boolean(workspaceId),
    retry: false,
  });

  const scheduledQuery = useQuery({
    queryKey: ['scheduled-messages', workspaceId, selectedChannel?.id],
    queryFn: () => getScheduledMessages(workspaceId!, selectedChannel?.id, 'PENDING'),
    enabled: Boolean(workspaceId && selectedChannel?.id),
    retry: false,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [threadRootMessage, setThreadRootMessage] = useState<Message | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const threadQuery = useQuery({
    queryKey: ['thread', activeThreadId],
    queryFn: () => getThread(activeThreadId!),
    enabled: Boolean(activeThreadId),
    retry: false,
  });

  useEffect(() => {
    setMessages(sortMessages(messageQuery.data?.data ?? []));
  }, [messageQuery.data]);

  useEffect(() => {
    setThreadRootMessage(null);
    setActiveThreadId(null);
    setThreadFeedback(null);
    setComposerFeedback(null);
    setComposerContent('');
    setDraftHydratedChannelId(null);
    setShowUtilities(false);
    setActiveUtilityTab('PINNED');
    draftErrorRef.current = null;
  }, [selectedChannel?.id]);

  useEffect(() => {
    if (!selectedChannel?.id || draftHydratedChannelId === selectedChannel.id || draftsQuery.isLoading) {
      return;
    }

    const baseDraft = (draftsQuery.data ?? []).find((draft) => !draft.threadId);
    setComposerContent(baseDraft?.content ?? '');
    setDraftHydratedChannelId(selectedChannel.id);
  }, [draftHydratedChannelId, draftsQuery.data, draftsQuery.isLoading, selectedChannel?.id]);

  useEffect(() => {
    if (!selectedChannel?.id || !workspaceId || draftHydratedChannelId !== selectedChannel.id) {
      return;
    }

    const channelId = selectedChannel.id;
    const timer = window.setTimeout(() => {
      void upsertDraft(channelId, composerContent).catch((error) => {
        const message = resolveApiError(error);
        if (draftErrorRef.current !== message) {
          draftErrorRef.current = message;
          toast.error(`Draft save failed: ${message}`);
        }
      });
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [composerContent, draftHydratedChannelId, selectedChannel?.id, workspaceId]);

  const handlers = useMemo(
    () => ({
      onMessageCreated: (payload: unknown) => {
        const message = payload as Message;
        if (message.channelId !== selectedChannel?.id) return;
        setMessages((prev) => upsertMessage(prev, message));
      },
      onMessageUpdated: (payload: unknown) => {
        const message = payload as Message;
        setMessages((prev) => upsertMessage(prev, message));
      },
      onMessageDeleted: (payload: unknown) => {
        const message = payload as Message;
        setMessages((prev) => upsertMessage(prev, message));
      },
      onThreadReply: (payload: unknown) => {
        const message = payload as Message;
        if (message.channelId !== selectedChannel?.id) return;
        setMessages((prev) => upsertMessage(prev, message));
        if (message.threadId && message.threadId === activeThreadId) {
          queryClient.invalidateQueries({ queryKey: ['thread', activeThreadId] });
        }
      },
      onTypingUpdate: () => {
        // Presence indicators can be rendered here.
      },
    }),
    [activeThreadId, queryClient, selectedChannel?.id],
  );

  const { socket } = useRealtime(accessToken ?? undefined, handlers);

  useEffect(() => {
    if (!socket || !selectedChannel?.id) return;
    socket.emit('channel:join', { channelId: selectedChannel.id });

    return () => {
      socket.emit('channel:leave', { channelId: selectedChannel.id });
    };
  }, [selectedChannel?.id, socket]);

  const sendMessage = async (content: string) => {
    if (!selectedChannel?.id) return;

    setComposerFeedback(null);
    try {
      const response = await apiClient.post<Message>('/messages', {
        channelId: selectedChannel.id,
        content,
      });
      setMessages((prev) => upsertMessage(prev, response.data));
      setComposerContent('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedChannel.id] });
      queryClient.invalidateQueries({ queryKey: ['drafts', workspaceId, selectedChannel.id] });
    } catch (error) {
      const message = resolveApiError(error);
      setComposerFeedback(message);
      toast.error(message);
      throw error;
    }
  };

  const scheduleSend = async (content: string, sendAtLocal: string) => {
    if (!selectedChannel?.id || !workspaceId) {
      return;
    }

    setComposerFeedback(null);
    try {
      const sendAtIso = new Date(sendAtLocal).toISOString();
      const scheduled = await scheduleMessage(selectedChannel.id, content, sendAtIso);
      setComposerContent('');
      setComposerFeedback(`Message scheduled for ${new Date(scheduled.sendAt).toLocaleString()}.`);
      queryClient.invalidateQueries({
        queryKey: ['scheduled-messages', workspaceId, selectedChannel.id],
      });
    } catch (error) {
      const message = resolveApiError(error);
      setComposerFeedback(message);
      toast.error(message);
      throw error;
    }
  };

  const openThread = async (message: Message) => {
    if (!selectedChannel?.id) {
      return;
    }

    setThreadFeedback(null);
    const root = message.parentMessageId
      ? messages.find((item) => item.id === message.parentMessageId) ?? message
      : message;
    setThreadRootMessage(root);

    if (message.threadId) {
      setActiveThreadId(message.threadId);
      return;
    }

    try {
      const thread = await createThread(message.id, selectedChannel.id);
      setActiveThreadId(thread.id);
    } catch (error) {
      const msg = resolveApiError(error);
      setThreadFeedback(msg);
      toast.error(msg);
    }
  };

  const sendThreadReply = async (content: string) => {
    if (!activeThreadId) {
      return;
    }

    try {
      const reply = await replyToThread(activeThreadId, content);
      setMessages((prev) => upsertMessage(prev, reply));
      setThreadFeedback('Reply sent.');
      queryClient.invalidateQueries({ queryKey: ['thread', activeThreadId] });
    } catch (error) {
      const message = resolveApiError(error);
      setThreadFeedback(message);
      toast.error(message);
      throw error;
    }
  };

  const pinnedMessageIds = useMemo(
    () => new Set((pinsQuery.data?.data ?? []).map((pin) => pin.messageId)),
    [pinsQuery.data],
  );

  const bookmarksByMessageId = useMemo(() => {
    const records = new Map<string, string>();
    for (const bookmark of bookmarksQuery.data?.data ?? []) {
      records.set(bookmark.messageId, bookmark.id);
    }
    return records;
  }, [bookmarksQuery.data]);

  const bookmarkedMessageIds = useMemo(
    () => new Set([...bookmarksByMessageId.keys()]),
    [bookmarksByMessageId],
  );

  const togglePin = async (message: Message) => {
    if (!selectedChannel?.id) {
      return;
    }

    try {
      if (pinnedMessageIds.has(message.id)) {
        await unpinMessage(message.id);
      } else {
        await pinMessage(message.id);
      }
      queryClient.invalidateQueries({ queryKey: ['pins', selectedChannel.id] });
    } catch (error) {
      toast.error(resolveApiError(error));
    }
  };

  const toggleBookmark = async (message: Message) => {
    if (!workspaceId || !selectedChannel?.id) {
      return;
    }

    try {
      const bookmarkId = bookmarksByMessageId.get(message.id);
      if (bookmarkId) {
        await deleteBookmark(bookmarkId);
      } else {
        await createBookmark(message.id);
      }

      queryClient.invalidateQueries({
        queryKey: ['bookmarks', workspaceId, selectedChannel.id],
      });
    } catch (error) {
      toast.error(resolveApiError(error));
    }
  };

  const availableDirectTargets = useMemo(
    () => (membersQuery.data ?? []).filter((member) => member.userId !== user?.id),
    [membersQuery.data, user?.id],
  );

  const filteredDirectTargets = useMemo(() => {
    const query = dmSearchTerm.trim().toLowerCase();
    if (!query) {
      return availableDirectTargets;
    }

    return availableDirectTargets.filter((member) => {
      const displayName = member.user.displayName.toLowerCase();
      const email = member.user.email.toLowerCase();
      return displayName.includes(query) || email.includes(query);
    });
  }, [availableDirectTargets, dmSearchTerm]);

  useEffect(() => {
    setActiveDmIndex(0);
  }, [dmSearchTerm, isDmComposerOpen]);

  const startDirectMessage = async (targetUserId: string) => {
    if (!workspaceId || !targetUserId) {
      return;
    }

    try {
      const channel = await createDirectChannel(workspaceId, targetUserId);
      await queryClient.invalidateQueries({ queryKey: ['channels', workspaceId] });
      setSelectedChannel(channel);
      requestedChannelAppliedRef.current = channel.id;
      router.replace(`/messages?channelId=${encodeURIComponent(channel.id)}`);
      setIsDmComposerOpen(false);
      setDmSearchTerm('');
      setActiveDmIndex(0);
      toast.success('Direct message channel ready');
    } catch (error) {
      toast.error(resolveApiError(error));
    }
  };

  const scheduledMessages = useMemo(
    () => scheduledQuery.data?.data ?? [],
    [scheduledQuery.data],
  );

  const cancelScheduled = async (scheduledMessage: ScheduledMessage) => {
    if (!workspaceId || !selectedChannel?.id) {
      return;
    }

    try {
      await cancelScheduledMessage(scheduledMessage.id);
      queryClient.invalidateQueries({
        queryKey: ['scheduled-messages', workspaceId, selectedChannel.id],
      });
    } catch (error) {
      toast.error(resolveApiError(error));
    }
  };

  const replies = useMemo(() => {
    if (threadQuery.data?.replies) {
      return sortMessages(threadQuery.data.replies);
    }

    if (!activeThreadId) {
      return [];
    }

    return sortMessages(
      messages.filter((message) => message.threadId === activeThreadId),
    );
  }, [activeThreadId, messages, threadQuery.data?.replies]);

  const channelTimelineMessages = useMemo(
    () => messages.filter((message) => !message.parentMessageId && !message.threadId),
    [messages],
  );

  const threadReplyCounts = useMemo(() => {
    return messages.reduce<Record<string, number>>((counts, message) => {
      if (!message.parentMessageId) {
        return counts;
      }

      counts[message.parentMessageId] = (counts[message.parentMessageId] ?? 0) + 1;
      return counts;
    }, {});
  }, [messages]);

  const selectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    requestedChannelAppliedRef.current = channel.id;
    router.replace(`/messages?channelId=${encodeURIComponent(channel.id)}`);
  };

  const hasActiveThread = Boolean(threadRootMessage || activeThreadId);
  const pinnedUtilityItems = (pinsQuery.data?.data ?? []).map((pin) => ({
    id: pin.id,
    label: pin.message.author?.displayName ?? pin.message.authorId,
    description: pin.message.content,
    actionLabel: 'Open thread',
    onAction: () => openThread(pin.message),
  }));

  const bookmarkUtilityItems = (bookmarksQuery.data?.data ?? []).map((bookmark) => ({
    id: bookmark.id,
    label: bookmark.message.author?.displayName ?? bookmark.message.authorId,
    description: bookmark.message.content,
    actionLabel: 'Open thread',
    onAction: () => openThread(bookmark.message),
  }));

  const scheduledUtilityItems = scheduledMessages.map((scheduled) => ({
    id: scheduled.id,
    label: new Date(scheduled.sendAt).toLocaleString(),
    description: scheduled.content,
    actionLabel: 'Cancel schedule',
    actionIcon: <Trash2 size={12} />,
    onAction: () => {
      void cancelScheduled(scheduled);
    },
  }));

  const utilityCount =
    pinnedUtilityItems.length + bookmarkUtilityItems.length + scheduledUtilityItems.length;

  const activeUtilityItems =
    activeUtilityTab === 'PINNED'
      ? pinnedUtilityItems
      : activeUtilityTab === 'BOOKMARKS'
        ? bookmarkUtilityItems
        : scheduledUtilityItems;

  return (
    <AppShell title="Messages">
      {!workspaceId && (
        <p className="mb-4 text-sm text-slate-500">
          Select a workspace to start messaging.
        </p>
      )}
      {workspaceId && channelQuery.isError && (
        <p className="mb-4 text-sm font-semibold text-red-600">
          Unable to load channels for this workspace.
        </p>
      )}
      <section className="overflow-hidden border-y border-slate-200 bg-white">
        <div
          className={clsx(
            'grid min-h-[calc(100vh-12rem)] grid-cols-1 lg:min-h-[calc(100vh-14rem)] lg:divide-x lg:divide-slate-200',
            hasActiveThread ? 'lg:grid-cols-[20rem_1fr_22rem]' : 'lg:grid-cols-[20rem_1fr]',
          )}
        >
          <div className="border-b border-slate-200 lg:border-b-0">
            <ChannelList
              channels={channels}
              selectedChannelId={selectedChannel?.id}
              onSelect={selectChannel}
              onComposeDirectMessage={() => setIsDmComposerOpen(true)}
            />
          </div>
          <div className="flex min-h-0 flex-col border-b border-slate-200 lg:border-b-0">
            <ChatWindow
              activeChannelName={resolveChannelName(selectedChannel, user?.id)}
              activeChannelType={selectedChannel?.type}
              messages={channelTimelineMessages}
              threadReplyCounts={threadReplyCounts}
              onOpenThread={openThread}
              pinnedMessageIds={pinnedMessageIds}
              bookmarkedMessageIds={bookmarkedMessageIds}
              onTogglePin={togglePin}
              onToggleBookmark={toggleBookmark}
            />
            {composerFeedback && (
              <p
                className={`px-3 py-2 text-sm font-semibold sm:px-4 ${
                  composerFeedback.toLowerCase().includes('scheduled')
                    ? 'text-emerald-700'
                    : 'text-red-600'
                }`}
              >
                {composerFeedback}
              </p>
            )}
            <div className="px-3 sm:px-4">
              <MessageComposer
                onSend={sendMessage}
                onSchedule={scheduleSend}
                disabled={!selectedChannel || messageQuery.isLoading}
                workspaceId={workspaceId}
                value={composerContent}
                onChange={setComposerContent}
              />
            </div>
            <div className="border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowUtilities((value) => !value)}
                className="w-full px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:bg-slate-50 sm:px-4"
              >
                {showUtilities ? 'Hide utilities' : 'Show utilities'} ({utilityCount})
              </button>
              {showUtilities && (
                <div className="border-t border-slate-200">
                  <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 sm:px-4">
                    <UtilityTabButton
                      label="Pinned"
                      count={pinnedUtilityItems.length}
                      active={activeUtilityTab === 'PINNED'}
                      onClick={() => setActiveUtilityTab('PINNED')}
                      icon={<Pin size={13} />}
                    />
                    <UtilityTabButton
                      label="Bookmarks"
                      count={bookmarkUtilityItems.length}
                      active={activeUtilityTab === 'BOOKMARKS'}
                      onClick={() => setActiveUtilityTab('BOOKMARKS')}
                      icon={<Bookmark size={13} />}
                    />
                    <UtilityTabButton
                      label="Scheduled"
                      count={scheduledUtilityItems.length}
                      active={activeUtilityTab === 'SCHEDULED'}
                      onClick={() => setActiveUtilityTab('SCHEDULED')}
                      icon={<CalendarClock size={13} />}
                    />
                  </div>
                  <UtilityPanel
                    title={
                      activeUtilityTab === 'PINNED'
                        ? 'Pinned messages'
                        : activeUtilityTab === 'BOOKMARKS'
                          ? 'Bookmarked messages'
                          : 'Scheduled messages'
                    }
                    emptyText={
                      activeUtilityTab === 'PINNED'
                        ? 'No pinned messages'
                        : activeUtilityTab === 'BOOKMARKS'
                          ? 'No bookmarks'
                          : 'No scheduled messages'
                    }
                    items={activeUtilityItems}
                  />
                </div>
              )}
            </div>
          </div>
          {hasActiveThread && (
            <div className="border-t border-slate-200 lg:border-t-0">
              <ThreadPanel
                rootMessage={threadRootMessage}
                replies={replies}
                isLoading={threadQuery.isLoading}
                feedback={threadFeedback}
                onReply={activeThreadId ? sendThreadReply : undefined}
                workspaceId={workspaceId}
              />
            </div>
          )}
        </div>
      </section>
      {isDmComposerOpen && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/35 p-4 pt-[14vh] sm:pt-[18vh]"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsDmComposerOpen(false);
              setDmSearchTerm('');
            }
          }}
        >
          <div className="w-full max-w-xl border border-slate-200 bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 sm:text-base">Start new direct message</h4>
                <p className="text-xs text-slate-500">Search teammate by name or email</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDmComposerOpen(false);
                  setDmSearchTerm('');
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close new direct message dialog"
              >
                <X size={16} />
              </button>
            </header>
            <div className="border-b border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3">
              <label className="inline-flex w-full items-center gap-2 border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-500">
                <Search size={14} className="text-slate-400" />
                <input
                  value={dmSearchTerm}
                  onChange={(event) => setDmSearchTerm(event.target.value)}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={filteredDirectTargets.length > 0}
                  aria-controls="dm-target-list"
                  aria-activedescendant={
                    filteredDirectTargets[activeDmIndex]
                      ? `dm-target-${filteredDirectTargets[activeDmIndex].userId}`
                      : undefined
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      setIsDmComposerOpen(false);
                      setDmSearchTerm('');
                      return;
                    }

                    if (filteredDirectTargets.length === 0) {
                      return;
                    }

                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      setActiveDmIndex((index) => (index + 1) % filteredDirectTargets.length);
                      return;
                    }

                    if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      setActiveDmIndex((index) => (index - 1 + filteredDirectTargets.length) % filteredDirectTargets.length);
                      return;
                    }

                    if (event.key === 'Enter') {
                      event.preventDefault();
                      const selectedMember = filteredDirectTargets[activeDmIndex];
                      if (selectedMember) {
                        void startDirectMessage(selectedMember.userId);
                      }
                    }
                  }}
                  placeholder="Type a teammate name..."
                  autoFocus
                  className="w-full bg-transparent text-slate-700 outline-none placeholder:text-slate-400"
                />
              </label>
            </div>
            <div id="dm-target-list" role="listbox" className="max-h-80 overflow-y-auto">
              {filteredDirectTargets.length === 0 && (
                <p className="px-3 py-3 text-sm text-slate-500 sm:px-4">No matching teammate found.</p>
              )}
              {filteredDirectTargets.map((member, index) => (
                <button
                  id={`dm-target-${member.userId}`}
                  key={member.userId}
                  type="button"
                  role="option"
                  aria-selected={index === activeDmIndex}
                  onClick={() => {
                    void startDirectMessage(member.userId);
                  }}
                  className={clsx(
                    'flex w-full items-center gap-3 border-t border-slate-100 px-3 py-2.5 text-left transition first:border-t-0 sm:px-4',
                    index === activeDmIndex ? 'bg-blue-50/70' : 'hover:bg-slate-50',
                  )}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold uppercase text-slate-700">
                    {initialsFromName(member.user.displayName || member.user.email)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {member.user.displayName}
                    </span>
                    <span className="block truncate text-xs text-slate-500">{member.user.email}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function sortMessages(messages: Message[]) {
  return [...messages].sort((left, right) => {
    if (left.sequence !== right.sequence) {
      return left.sequence - right.sequence;
    }
    return (
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
  });
}

function upsertMessage(messages: Message[], next: Message) {
  const index = messages.findIndex((message) => message.id === next.id);
  if (index === -1) {
    return sortMessages([...messages, next]);
  }

  const copy = [...messages];
  copy[index] = next;
  return sortMessages(copy);
}

function resolveChannelName(channel: Channel | null, currentUserId?: string) {
  if (!channel) {
    return undefined;
  }

  if (channel.type !== 'DIRECT') {
    return channel.name;
  }

  const counterpart = channel.members?.find((member) => member.userId !== currentUserId)?.user;
  return counterpart?.displayName || counterpart?.email || 'Direct message';
}

function initialsFromName(value: string) {
  const words = value
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 'DM';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function UtilityTabButton({
  label,
  count,
  active,
  icon,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition',
        active
          ? 'border-blue-300 bg-blue-50 text-blue-700'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
      )}
    >
      {icon}
      {label}
      <span
        className={clsx(
          'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
          active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600',
        )}
      >
        {count}
      </span>
    </button>
  );
}

function UtilityPanel({
  title,
  emptyText,
  items,
}: {
  title: string;
  emptyText: string;
  items: {
    id: string;
    label: string;
    description: string;
    actionLabel: string;
    actionIcon?: React.ReactNode;
    onAction: () => void;
  }[];
}) {
  return (
    <section className="border-t border-slate-200 px-3 py-2.5 sm:px-4 sm:py-3">
      <header className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </header>
      <div>
        {items.length === 0 && <p className="px-1 py-2 text-sm text-slate-500">{emptyText}</p>}
        {items.slice(0, 5).map((item) => (
          <article key={item.id} className="border-t border-slate-200 px-1 py-2 first:border-t-0">
            <p className="truncate text-xs font-semibold text-slate-700">{item.label}</p>
            <p className="truncate text-sm text-slate-600">{item.description}</p>
            <button
              type="button"
              onClick={item.onAction}
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
            >
              {item.actionIcon}
              {item.actionLabel}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
