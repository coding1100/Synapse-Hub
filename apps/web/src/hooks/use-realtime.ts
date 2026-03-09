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
  const handlersRef = useRef<SocketHandlers | undefined>(handlers);
  const [connected, setConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const wsUrl = useMemo(
    () => process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
    [],
  );

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      setStatusMessage('Missing access token for realtime session.');
      return;
    }

    const socket = io(`${wsUrl}/ws`, {
      auth: {
        token,
      },
      transports: ['websocket'],
      timeout: 10_000,
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 8_000,
      randomizationFactor: 0.5,
    });

    socketRef.current = socket;

    const handleConnect = () => {
      setConnected(true);
      setStatusMessage(null);
    };

    const handleDisconnect = (reason: Socket.DisconnectReason) => {
      setConnected(false);
      setStatusMessage(`Disconnected: ${reason}`);
    };

    const handleConnectError = (error: Error) => {
      const message = error.message || 'Connection failed';
      setConnected(false);
      setStatusMessage(`Connection error: ${message}`);

      const normalized = message.toLowerCase();
      if (normalized.includes('unauthorized') || normalized.includes('token')) {
        socket.io.opts.reconnection = false;
      }
    };

    const handleReconnectAttempt = (attempt: number) => {
      setStatusMessage(`Reconnecting... attempt ${attempt}`);
    };

    const handleReconnectFailed = () => {
      setStatusMessage('Realtime unavailable after retries.');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    socket.on('message:created', (payload) => {
      handlersRef.current?.onMessageCreated?.(payload);
    });
    socket.on('message:updated', (payload) => {
      handlersRef.current?.onMessageUpdated?.(payload);
    });
    socket.on('message:deleted', (payload) => {
      handlersRef.current?.onMessageDeleted?.(payload);
    });
    socket.on('message:reacted', (payload) => {
      handlersRef.current?.onMessageReacted?.(payload);
    });
    socket.on('thread:reply', (payload) => {
      handlersRef.current?.onThreadReply?.(payload);
    });
    socket.on('typing:update', (payload) => {
      handlersRef.current?.onTypingUpdate?.(payload);
    });

    socket.io.on('reconnect_attempt', handleReconnectAttempt);
    socket.io.on('reconnect_failed', handleReconnectFailed);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('message:created');
      socket.off('message:updated');
      socket.off('message:deleted');
      socket.off('message:reacted');
      socket.off('thread:reply');
      socket.off('typing:update');
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.io.off('reconnect_failed', handleReconnectFailed);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, wsUrl]);

  return {
    socket: socketRef.current,
    connected,
    statusMessage,
  };
}
