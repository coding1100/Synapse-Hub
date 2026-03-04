'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type SocketHandlers = {
  onMessageCreated?: (payload: unknown) => void;
  onMessageUpdated?: (payload: unknown) => void;
  onMessageDeleted?: (payload: unknown) => void;
  onMessageReacted?: (payload: unknown) => void;
  onThreadReply?: (payload: unknown) => void;
  onTypingUpdate?: (payload: unknown) => void;
};

export function useRealtime(token?: string, handlers?: SocketHandlers) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  const wsUrl = useMemo(
    () => process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    [],
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = io(`${wsUrl}/ws`, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    if (handlers?.onMessageCreated) socket.on('message:created', handlers.onMessageCreated);
    if (handlers?.onMessageUpdated) socket.on('message:updated', handlers.onMessageUpdated);
    if (handlers?.onMessageDeleted) socket.on('message:deleted', handlers.onMessageDeleted);
    if (handlers?.onMessageReacted) socket.on('message:reacted', handlers.onMessageReacted);
    if (handlers?.onThreadReply) socket.on('thread:reply', handlers.onThreadReply);
    if (handlers?.onTypingUpdate) socket.on('typing:update', handlers.onTypingUpdate);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [handlers, token, wsUrl]);

  return {
    socket: socketRef.current,
    connected,
  };
}