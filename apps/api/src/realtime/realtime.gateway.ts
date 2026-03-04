import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { MessagingClientService } from './messaging-client.service';
import { RedisPubSubService } from './redis-pubsub.service';

@WebSocketGateway({
  namespace: '/ws',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly messagingClient: MessagingClientService,
    private readonly redisPubSub: RedisPubSubService,
  ) {}

  afterInit() {
    this.redisPubSub.onEvent((event) => {
      this.server.to(event.room).emit(event.event, event.payload);
    });
  }

  handleConnection(client: Socket) {
    const token = this.extractAccessToken(client);
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = verify(token, process.env.JWT_ACCESS_SECRET ?? 'access-secret') as {
        sub?: string;
      };

      if (!payload.sub) {
        throw new Error('Missing sub in token');
      }

      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected ${client.id}`);
  }

  @SubscribeMessage('channel:join')
  async joinChannel(
    @MessageBody() payload: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`channel:${payload.channelId}`);
    return { joined: true, channelId: payload.channelId };
  }

  @SubscribeMessage('channel:leave')
  async leaveChannel(
    @MessageBody() payload: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`channel:${payload.channelId}`);
    return { joined: false, channelId: payload.channelId };
  }

  @SubscribeMessage('message:send')
  async sendMessage(
    @MessageBody() payload: { channelId: string; content: string; fileIds?: string[]; threadId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.ensurePayload(payload.channelId && payload.content, 'channelId and content are required');

    const userId = this.getUserId(client);
    const message = await this.messagingClient.sendMessage(userId, payload);

    await this.redisPubSub.publish({
      room: `channel:${message.channelId}`,
      event: 'message:created',
      payload: message,
    });

    return message;
  }

  @SubscribeMessage('message:edit')
  async editMessage(
    @MessageBody() payload: { messageId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.ensurePayload(payload.messageId && payload.content, 'messageId and content are required');

    const userId = this.getUserId(client);
    const message = await this.messagingClient.editMessage(payload.messageId, {
      content: payload.content,
      editorUserId: userId,
    });

    await this.redisPubSub.publish({
      room: `channel:${message.channelId}`,
      event: 'message:updated',
      payload: message,
    });

    return message;
  }

  @SubscribeMessage('message:delete')
  async deleteMessage(
    @MessageBody() payload: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.ensurePayload(payload.messageId, 'messageId is required');

    const userId = this.getUserId(client);
    const message = await this.messagingClient.deleteMessage(payload.messageId, userId);

    await this.redisPubSub.publish({
      room: `channel:${message.channelId}`,
      event: 'message:deleted',
      payload: message,
    });

    return message;
  }

  @SubscribeMessage('message:react')
  async reactToMessage(
    @MessageBody() payload: { messageId: string; channelId: string; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.ensurePayload(payload.messageId && payload.emoji && payload.channelId, 'messageId, channelId and emoji are required');

    const userId = this.getUserId(client);
    const reaction = await this.messagingClient.reactToMessage(payload.messageId, {
      userId,
      emoji: payload.emoji,
    });

    await this.redisPubSub.publish({
      room: `channel:${payload.channelId}`,
      event: 'message:reacted',
      payload: {
        channelId: payload.channelId,
        messageId: payload.messageId,
        reaction,
      },
    });

    return reaction;
  }

  @SubscribeMessage('thread:create')
  async createThread(@MessageBody() payload: { rootMessageId: string; channelId: string }) {
    this.ensurePayload(payload.rootMessageId && payload.channelId, 'rootMessageId and channelId are required');

    const thread = await this.messagingClient.createThread(payload);

    await this.redisPubSub.publish({
      room: `channel:${payload.channelId}`,
      event: 'thread:created',
      payload: thread,
    });

    return thread;
  }

  @SubscribeMessage('thread:reply')
  async replyToThread(
    @MessageBody() payload: { threadId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.ensurePayload(payload.threadId && payload.content, 'threadId and content are required');

    const userId = this.getUserId(client);
    const reply = await this.messagingClient.replyToThread(payload.threadId, {
      userId,
      content: payload.content,
    });

    await this.redisPubSub.publish({
      room: `channel:${reply.channelId}`,
      event: 'thread:reply',
      payload: reply,
    });

    return reply;
  }

  @SubscribeMessage('typing:start')
  async typingStart(
    @MessageBody() payload: { channelId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.ensurePayload(payload.channelId, 'channelId is required');

    const userId = this.getUserId(client);
    const typingEvent = {
      channelId: payload.channelId,
      userId,
      isTyping: true,
      timestamp: new Date().toISOString(),
    };

    await this.redisPubSub.publish({
      room: `channel:${payload.channelId}`,
      event: 'typing:update',
      payload: typingEvent,
    });

    return typingEvent;
  }

  private getUserId(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) {
      throw new WsException('Unauthorized socket client');
    }
    return userId;
  }

  private ensurePayload(condition: unknown, message: string): asserts condition {
    if (!condition) {
      throw new WsException(message);
    }
  }

  private extractAccessToken(client: Socket) {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    return undefined;
  }
}