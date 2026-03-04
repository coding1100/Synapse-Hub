'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppShell } from '@/components/app-shell';
import { ChannelList } from '@/components/channel-list';
import { ChatWindow } from '@/components/chat-window';
import { MessageComposer } from '@/components/message-composer';
import { ThreadPanel } from '@/components/thread-panel';
import { apiClient } from '@/lib/api-client';
import { getChannels, getMessages, getWorkspaces } from '@/lib/queries';
import { useAuth } from '@/providers/auth-provider';
import { Channel, Message } from '@/types';
import { useRealtime } from '@/hooks/use-realtime';

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  const { data: workspaceData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });

  const workspaceId = workspaceData?.data[0]?.id;

  const { data: channelData } = useQuery({
    queryKey: ['channels', workspaceId],
    queryFn: () => getChannels(workspaceId!),
    enabled: Boolean(workspaceId),
  });

  const channels = useMemo(() => channelData?.data ?? [], [channelData]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  useEffect(() => {
    if (!selectedChannel && channels.length > 0) {
      setSelectedChannel(channels[0]);
    }
  }, [channels, selectedChannel]);

  const { data: messageData } = useQuery({
    queryKey: ['messages', selectedChannel?.id],
    queryFn: () => getMessages(selectedChannel!.id),
    enabled: Boolean(selectedChannel?.id),
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [threadRoot, setThreadRoot] = useState<Message | null>(null);

  useEffect(() => {
    setMessages(messageData?.data ?? []);
  }, [messageData]);

  const handlers = useMemo(
    () => ({
      onMessageCreated: (payload: unknown) => {
        const message = payload as Message;
        if (message.channelId !== selectedChannel?.id) return;
        setMessages((prev) => [...prev, message]);
        queryClient.invalidateQueries({ queryKey: ['messages', selectedChannel?.id] });
      },
      onMessageUpdated: (payload: unknown) => {
        const message = payload as Message;
        setMessages((prev) => prev.map((item) => (item.id === message.id ? message : item)));
      },
      onMessageDeleted: (payload: unknown) => {
        const message = payload as Message;
        setMessages((prev) => prev.map((item) => (item.id === message.id ? message : item)));
      },
      onThreadReply: (payload: unknown) => {
        const message = payload as Message;
        if (message.channelId !== selectedChannel?.id) return;
        setMessages((prev) => [...prev, message]);
      },
      onTypingUpdate: () => {
        // Presence indicators can be rendered here.
      },
    }),
    [queryClient, selectedChannel?.id],
  );

  const { socket, connected } = useRealtime(accessToken ?? undefined, handlers);

  useEffect(() => {
    if (!socket || !selectedChannel?.id) return;
    socket.emit('channel:join', { channelId: selectedChannel.id });

    return () => {
      socket.emit('channel:leave', { channelId: selectedChannel.id });
    };
  }, [selectedChannel?.id, socket]);

  const sendMessage = async (content: string) => {
    if (!selectedChannel?.id) return;

    if (socket && connected) {
      socket.emit('message:send', {
        channelId: selectedChannel.id,
        content,
      });
      return;
    }

    await apiClient.post('/messages', {
      channelId: selectedChannel.id,
      content,
      userId: 'fallback-user',
    });
    queryClient.invalidateQueries({ queryKey: ['messages', selectedChannel.id] });
  };

  const replies = useMemo(() => {
    if (!threadRoot?.threadId) return [];
    return messages.filter((message) => message.threadId === threadRoot.threadId);
  }, [messages, threadRoot?.threadId]);

  return (
    <AppShell title="Messages">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Realtime status: {connected ? 'connected' : 'offline'}
      </div>
      <div className="grid h-[calc(100vh-11rem)] grid-cols-1 gap-4 xl:grid-cols-[18rem_1fr_22rem]">
        <ChannelList
          channels={channels}
          selectedChannelId={selectedChannel?.id}
          onSelect={setSelectedChannel}
        />
        <div className="flex min-h-0 flex-col gap-4">
          <ChatWindow
            activeChannelName={selectedChannel?.name}
            messages={messages}
            onOpenThread={setThreadRoot}
          />
          <MessageComposer onSend={sendMessage} disabled={!selectedChannel} />
        </div>
        <ThreadPanel rootMessage={threadRoot} replies={replies} />
      </div>
    </AppShell>
  );
}