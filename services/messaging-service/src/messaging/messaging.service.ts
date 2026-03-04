import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SendMessageDto } from './dto/send-message.dto';

type Message = {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  fileIds: string[];
  threadId?: string;
  sequence: number;
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date;
  deletedAt?: Date;
};

type Thread = {
  id: string;
  rootMessageId: string;
  channelId: string;
  createdAt: Date;
};

type Reaction = {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
};

@Injectable()
export class MessagingService {
  private readonly messages = new Map<string, Message>();
  private readonly messageIdsByChannel = new Map<string, string[]>();
  private readonly reactionsByMessage = new Map<string, Reaction[]>();
  private readonly threads = new Map<string, Thread>();
  private sequence = 0;

  sendMessage(dto: SendMessageDto) {
    const message: Message = {
      id: uuidv4(),
      channelId: dto.channelId,
      userId: dto.userId,
      content: dto.content,
      fileIds: dto.fileIds ?? [],
      threadId: dto.threadId,
      sequence: ++this.sequence,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.messages.set(message.id, message);
    const channelMessages = this.messageIdsByChannel.get(dto.channelId) ?? [];
    channelMessages.push(message.id);
    this.messageIdsByChannel.set(dto.channelId, channelMessages);

    return message;
  }

  listMessages(channelId: string, cursor?: string, limit = 50) {
    const boundedLimit = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 50, 200));
    const ids = this.messageIdsByChannel.get(channelId) ?? [];
    const messages = ids.map((id) => this.messages.get(id)).filter((m): m is Message => !!m);

    const startIdx = cursor ? Math.max(messages.findIndex((m) => m.id === cursor) + 1, 0) : 0;
    const data = messages.slice(startIdx, startIdx + boundedLimit);

    return {
      data,
      paging: {
        cursor: data.length === boundedLimit ? data[data.length - 1].id : null,
        limit: boundedLimit,
      },
    };
  }

  editMessage(messageId: string, content: string, editorUserId?: string) {
    const message = this.ensureMessage(messageId);
    if (editorUserId && message.userId !== editorUserId) {
      throw new NotFoundException('Only author can edit message');
    }

    message.content = content;
    message.editedAt = new Date();
    message.updatedAt = new Date();
    this.messages.set(message.id, message);
    return message;
  }

  deleteMessage(messageId: string, deletedByUserId: string) {
    const message = this.ensureMessage(messageId);
    if (message.userId !== deletedByUserId) {
      throw new NotFoundException('Only author can delete message');
    }

    message.deletedAt = new Date();
    message.content = '[deleted]';
    message.updatedAt = new Date();
    this.messages.set(message.id, message);
    return message;
  }

  reactToMessage(messageId: string, userId: string, emoji: string) {
    this.ensureMessage(messageId);
    const reactions = this.reactionsByMessage.get(messageId) ?? [];
    const existing = reactions.find((r) => r.userId === userId && r.emoji === emoji);
    if (existing) {
      return existing;
    }

    const reaction: Reaction = {
      id: uuidv4(),
      messageId,
      userId,
      emoji,
      createdAt: new Date(),
    };
    reactions.push(reaction);
    this.reactionsByMessage.set(messageId, reactions);

    return reaction;
  }

  typing(channelId: string, userId: string) {
    return {
      channelId,
      userId,
      typing: true,
      timestamp: new Date().toISOString(),
    };
  }

  createThread(rootMessageId: string, channelId: string) {
    this.ensureMessage(rootMessageId);
    const existing = [...this.threads.values()].find((t) => t.rootMessageId === rootMessageId);
    if (existing) {
      return existing;
    }

    const thread: Thread = {
      id: uuidv4(),
      rootMessageId,
      channelId,
      createdAt: new Date(),
    };
    this.threads.set(thread.id, thread);
    return thread;
  }

  replyInThread(threadId: string, userId: string, content: string) {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    return this.sendMessage({
      channelId: thread.channelId,
      userId,
      content,
      threadId,
      fileIds: [],
    });
  }

  getThread(threadId: string) {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const replies = [...this.messages.values()]
      .filter((m) => m.threadId === threadId)
      .sort((a, b) => a.sequence - b.sequence);

    return {
      thread,
      replies,
    };
  }

  private ensureMessage(messageId: string) {
    const message = this.messages.get(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }
}
