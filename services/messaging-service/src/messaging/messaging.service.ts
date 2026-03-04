import { Injectable, NotFoundException } from '@nestjs/common';
import { Message, PrismaClient } from '@prisma/client';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagingService {
  private readonly prisma = new PrismaClient();

  async sendMessage(dto: SendMessageDto) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: dto.channelId },
      select: { id: true, workspaceId: true },
    });
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await this.prisma.user.upsert({
      where: { id: dto.userId },
      create: {
        id: dto.userId,
        email: `${dto.userId}@synapsehub.local`,
        displayName: `user-${dto.userId.slice(0, 6)}`,
      },
      update: {},
    });

    const latest = await this.prisma.message.findFirst({
      where: { channelId: dto.channelId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });

    const sequence = (latest?.sequence ?? BigInt(0)) + BigInt(1);

    const message = await this.prisma.message.create({
      data: {
        workspaceId: channel.workspaceId,
        channelId: dto.channelId,
        authorId: dto.userId,
        content: dto.content,
        threadId: dto.threadId,
        sequence,
      },
    });

    if (dto.fileIds?.length) {
      await this.prisma.file.updateMany({
        where: {
          id: { in: dto.fileIds },
        },
        data: {
          messageId: message.id,
          channelId: dto.channelId,
        },
      });
    }

    return this.serializeMessage(message);
  }

  async listMessages(channelId: string, cursor?: string, limit = 50) {
    const boundedLimit = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 50, 200));

    const data = await this.prisma.message.findMany({
      where: { channelId },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: boundedLimit,
      orderBy: { createdAt: 'asc' },
      include: {
        reactions: true,
        files: true,
      },
    });

    return {
      data: data.map((message) => this.serializeMessage(message)),
      paging: {
        cursor: data.length === boundedLimit ? data[data.length - 1].id : null,
        limit: boundedLimit,
      },
    };
  }

  async editMessage(messageId: string, content: string, editorUserId?: string) {
    const existingMessage = await this.ensureMessage(messageId);
    if (editorUserId && existingMessage.authorId !== editorUserId) {
      throw new NotFoundException('Only author can edit message');
    }

    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        editedAt: new Date(),
      },
    });

    return this.serializeMessage(updatedMessage);
  }

  async deleteMessage(messageId: string, deletedByUserId: string) {
    const existingMessage = await this.ensureMessage(messageId);
    if (existingMessage.authorId !== deletedByUserId) {
      throw new NotFoundException('Only author can delete message');
    }

    const deletedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        content: '[deleted]',
      },
    });

    return this.serializeMessage(deletedMessage);
  }

  async reactToMessage(messageId: string, userId: string, emoji: string) {
    await this.ensureMessage(messageId);

    await this.prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: `${userId}@synapsehub.local`,
        displayName: `user-${userId.slice(0, 6)}`,
      },
      update: {},
    });

    return this.prisma.reaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji,
        },
      },
      create: {
        messageId,
        userId,
        emoji,
      },
      update: {},
    });
  }

  typing(channelId: string, userId: string) {
    return {
      channelId,
      userId,
      typing: true,
      timestamp: new Date().toISOString(),
    };
  }

  async createThread(rootMessageId: string, channelId: string) {
    const root = await this.prisma.message.findUnique({
      where: { id: rootMessageId },
      select: {
        id: true,
        workspaceId: true,
        authorId: true,
      },
    });

    if (!root) {
      throw new NotFoundException('Root message not found');
    }

    return this.prisma.thread.upsert({
      where: { rootMessageId },
      create: {
        rootMessageId,
        channelId,
        workspaceId: root.workspaceId,
        createdById: root.authorId,
      },
      update: {},
    });
  }

  async replyInThread(threadId: string, userId: string, content: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        channel: {
          select: {
            id: true,
            workspaceId: true,
          },
        },
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const latest = await this.prisma.message.findFirst({
      where: { channelId: thread.channelId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });

    await this.prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: `${userId}@synapsehub.local`,
        displayName: `user-${userId.slice(0, 6)}`,
      },
      update: {},
    });

    const reply = await this.prisma.message.create({
      data: {
        workspaceId: thread.channel.workspaceId,
        channelId: thread.channelId,
        authorId: userId,
        threadId,
        parentMessageId: thread.rootMessageId,
        content,
        sequence: (latest?.sequence ?? BigInt(0)) + BigInt(1),
      },
    });

    return this.serializeMessage(reply);
  }

  async getThread(threadId: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    const replies = await this.prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      thread,
      replies: replies.map((reply) => this.serializeMessage(reply)),
    };
  }

  private async ensureMessage(messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    return message;
  }

  private serializeMessage(message: Message) {
    return {
      ...message,
      sequence: Number(message.sequence),
    };
  }
}
