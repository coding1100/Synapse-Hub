import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  ChannelType,
  Message,
  Prisma,
  PrismaClient,
  ScheduledMessageStatus,
} from '@prisma/client';
import { SendMessageDto } from './dto/send-message.dto';

type MessageAuthor = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
};

type MessageWithAuthor = Message & {
  author?: MessageAuthor | null;
};

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private readonly prisma = new PrismaClient();
  private schedulerTimer: NodeJS.Timeout | null = null;
  private schedulerTickInFlight = false;
  private readonly schedulerIntervalMs = Number(
    process.env.SCHEDULED_MESSAGE_POLL_MS ?? '2000',
  );

  onModuleInit() {
    if (this.schedulerIntervalMs <= 0) {
      return;
    }

    this.schedulerTimer = setInterval(() => {
      void this.processDueScheduledMessages();
    }, this.schedulerIntervalMs);

    void this.processDueScheduledMessages();
  }

  async onModuleDestroy() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    await this.prisma.$disconnect();
  }

  async sendMessage(dto: SendMessageDto, userId: string) {
    const channel = await this.ensureChannelAccess(dto.channelId, userId);
    const thread = dto.threadId
      ? await this.ensureThreadInChannel(dto.threadId, dto.channelId)
      : null;

    const normalizedContent = dto.content.trim();
    if (!normalizedContent) {
      throw new BadRequestException('Message content is required');
    }

    const message = await this.createMessageWithSequence({
      workspaceId: channel.workspaceId,
      channelId: channel.id,
      authorId: userId,
      threadId: thread?.id ?? null,
      parentMessageId: thread?.rootMessageId ?? null,
      content: normalizedContent,
    });

    if (dto.fileIds && dto.fileIds.length > 0) {
      await this.attachFilesToMessage(
        dto.fileIds,
        message.id,
        channel.id,
        channel.workspaceId,
        userId,
      );
    }

    await this.emitMentionNotifications(
      channel.workspaceId,
      channel.id,
      channel.type,
      userId,
      message.id,
      dto.content,
    );

    if (thread) {
      await this.emitThreadReplyNotification(
        channel.workspaceId,
        thread.id,
        thread.rootMessageId,
        userId,
        message.id,
      );
    }

    return this.getSerializedMessage(message.id);
  }

  async listMessages(channelId: string, userId: string, cursor?: string, limit = 50) {
    await this.ensureChannelAccess(channelId, userId);

    const boundedLimit = this.normalizeLimit(limit, 50, 200);
    const data = await this.prisma.message.findMany({
      where: { channelId },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: boundedLimit,
      orderBy: [{ sequence: 'asc' }, { createdAt: 'asc' }],
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
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

  async editMessage(messageId: string, content: string, editorUserId: string) {
    const existing = await this.ensureMessageAccess(messageId, editorUserId);
    if (existing.authorId !== editorUserId) {
      throw new ForbiddenException('Only author can edit message');
    }

    if (existing.deletedAt) {
      throw new BadRequestException('Cannot edit deleted message');
    }

    const normalizedContent = content.trim();
    if (!normalizedContent) {
      throw new BadRequestException('Message content is required');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: normalizedContent,
        editedAt: new Date(),
      },
    });

    return this.getSerializedMessage(messageId);
  }

  async deleteMessage(messageId: string, deletedByUserId: string) {
    const existing = await this.ensureMessageAccess(messageId, deletedByUserId);
    if (existing.authorId !== deletedByUserId) {
      throw new ForbiddenException('Only author can delete message');
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
        content: '[deleted]',
      },
    });

    return this.getSerializedMessage(messageId);
  }

  async reactToMessage(messageId: string, userId: string, emoji: string) {
    await this.ensureMessageAccess(messageId, userId);

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

  async pinMessage(messageId: string, userId: string) {
    const message = await this.ensureMessageAccess(messageId, userId);

    const pin = await this.prisma.messagePin.upsert({
      where: {
        messageId,
      },
      create: {
        workspaceId: message.workspaceId,
        channelId: message.channelId,
        messageId,
        pinnedById: userId,
      },
      update: {
        pinnedById: userId,
      },
      include: {
        pinnedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        message: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return {
      ...pin,
      message: this.serializeMessage(pin.message),
    };
  }

  async unpinMessage(messageId: string, userId: string) {
    await this.ensureMessageAccess(messageId, userId);

    const result = await this.prisma.messagePin.deleteMany({
      where: { messageId },
    });

    return {
      messageId,
      unpinned: result.count > 0,
    };
  }

  async listPins(channelId: string, userId: string) {
    await this.ensureChannelAccess(channelId, userId);

    const data = await this.prisma.messagePin.findMany({
      where: { channelId },
      orderBy: { createdAt: 'desc' },
      include: {
        pinnedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        message: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return {
      data: data.map((pin) => ({
        ...pin,
        message: this.serializeMessage(pin.message),
      })),
    };
  }

  typing(channelId: string, userId: string) {
    return this.ensureChannelAccess(channelId, userId).then(() => ({
      channelId,
      userId,
      typing: true,
      timestamp: new Date().toISOString(),
    }));
  }

  async createThread(rootMessageId: string, channelId: string, userId: string) {
    await this.ensureChannelAccess(channelId, userId);

    const sourceMessage = await this.prisma.message.findUnique({
      where: { id: rootMessageId },
      select: {
        id: true,
        channelId: true,
        workspaceId: true,
        threadId: true,
        parentMessageId: true,
      },
    });

    if (!sourceMessage || sourceMessage.channelId !== channelId) {
      throw new NotFoundException('Root message not found');
    }

    if (sourceMessage.threadId) {
      const existingByThreadId = await this.prisma.thread.findUnique({
        where: { id: sourceMessage.threadId },
      });
      if (existingByThreadId) {
        return existingByThreadId;
      }
    }

    const canonicalRootMessageId = sourceMessage.parentMessageId ?? sourceMessage.id;
    const canonicalRoot = await this.prisma.message.findUnique({
      where: { id: canonicalRootMessageId },
      select: {
        id: true,
        channelId: true,
        workspaceId: true,
      },
    });

    if (!canonicalRoot || canonicalRoot.channelId !== channelId) {
      throw new NotFoundException('Root message not found');
    }

    return this.prisma.thread.upsert({
      where: { rootMessageId: canonicalRoot.id },
      create: {
        rootMessageId: canonicalRoot.id,
        channelId,
        workspaceId: canonicalRoot.workspaceId,
        createdById: userId,
      },
      update: {},
    });
  }

  async replyInThread(threadId: string, userId: string, content: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        workspaceId: true,
        channelId: true,
        rootMessageId: true,
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    await this.ensureChannelAccess(thread.channelId, userId);

    const normalizedContent = content.trim();
    if (!normalizedContent) {
      throw new BadRequestException('Reply content is required');
    }

    const reply = await this.createMessageWithSequence({
      workspaceId: thread.workspaceId,
      channelId: thread.channelId,
      authorId: userId,
      threadId: thread.id,
      parentMessageId: thread.rootMessageId,
      content: normalizedContent,
    });

    await this.emitMentionNotifications(
      thread.workspaceId,
      thread.channelId,
      await this.getChannelType(thread.channelId),
      userId,
      reply.id,
      content,
    );
    await this.emitThreadReplyNotification(
      thread.workspaceId,
      thread.id,
      thread.rootMessageId,
      userId,
      reply.id,
    );

    return this.getSerializedMessage(reply.id);
  }

  async getThread(threadId: string, userId: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    await this.ensureChannelAccess(thread.channelId, userId);

    const replies = await this.prisma.message.findMany({
      where: { threadId },
      orderBy: [{ sequence: 'asc' }, { createdAt: 'asc' }],
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      thread,
      replies: replies.map((reply) => this.serializeMessage(reply)),
    };
  }

  async createBookmark(messageId: string, userId: string) {
    const message = await this.ensureMessageAccess(messageId, userId);

    const bookmark = await this.prisma.bookmark.upsert({
      where: {
        userId_messageId: {
          userId,
          messageId,
        },
      },
      create: {
        userId,
        workspaceId: message.workspaceId,
        channelId: message.channelId,
        messageId,
      },
      update: {
        updatedAt: new Date(),
      },
      include: {
        message: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return {
      ...bookmark,
      message: this.serializeMessage(bookmark.message),
    };
  }

  async listBookmarks(
    workspaceId: string,
    userId: string,
    channelId?: string,
    cursor?: string,
    limit = 50,
  ) {
    await this.ensureWorkspaceMember(workspaceId, userId);
    if (channelId) {
      await this.ensureChannelAccess(channelId, userId);
    }

    const boundedLimit = this.normalizeLimit(limit, 50, 200);
    const data = await this.prisma.bookmark.findMany({
      where: {
        userId,
        workspaceId,
        ...(channelId ? { channelId } : {}),
      },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: boundedLimit,
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      include: {
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
        message: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return {
      data: data.map((bookmark) => ({
        ...bookmark,
        message: this.serializeMessage(bookmark.message),
      })),
      paging: {
        cursor: data.length === boundedLimit ? data[data.length - 1].id : null,
        limit: boundedLimit,
      },
    };
  }

  async deleteBookmark(bookmarkId: string, userId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: { id: bookmarkId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    if (bookmark.userId !== userId) {
      throw new ForbiddenException('Cannot delete another user bookmark');
    }

    await this.prisma.bookmark.delete({
      where: { id: bookmarkId },
    });

    return {
      id: bookmarkId,
      deleted: true,
    };
  }

  async upsertDraft(userId: string, channelId: string, content: string, threadId?: string) {
    const channel = await this.ensureChannelAccess(channelId, userId);
    const normalizedThreadId = threadId ?? null;
    const threadKey = normalizedThreadId ?? '';

    if (normalizedThreadId) {
      await this.ensureThreadInChannel(normalizedThreadId, channelId);
    }

    const normalizedContent = content.trim();
    if (!normalizedContent) {
      await this.prisma.messageDraft.deleteMany({
        where: {
          userId,
          channelId,
          threadKey,
        },
      });

      return {
        deleted: true,
        channelId,
        threadId: normalizedThreadId,
      };
    }

    return this.prisma.messageDraft.upsert({
      where: {
        userId_channelId_threadKey: {
          userId,
          channelId,
          threadKey,
        },
      },
      create: {
        userId,
        workspaceId: channel.workspaceId,
        channelId,
        threadId: normalizedThreadId,
        threadKey,
        content: normalizedContent,
      },
      update: {
        content: normalizedContent,
        threadId: normalizedThreadId,
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async listDrafts(userId: string, workspaceId: string, channelId?: string) {
    await this.ensureWorkspaceMember(workspaceId, userId);
    if (channelId) {
      await this.ensureChannelAccess(channelId, userId);
    }

    return this.prisma.messageDraft.findMany({
      where: {
        userId,
        workspaceId,
        ...(channelId ? { channelId } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async deleteDraft(userId: string, channelId: string, threadId?: string) {
    await this.ensureChannelAccess(channelId, userId);

    const threadKey = threadId ?? '';
    const result = await this.prisma.messageDraft.deleteMany({
      where: {
        userId,
        channelId,
        threadKey,
      },
    });

    return {
      deleted: result.count > 0,
      channelId,
      threadId: threadId ?? null,
    };
  }

  async scheduleMessage(
    userId: string,
    channelId: string,
    content: string,
    sendAt: string,
    threadId?: string,
  ) {
    const channel = await this.ensureChannelAccess(channelId, userId);
    const normalizedContent = content.trim();
    if (!normalizedContent) {
      throw new BadRequestException('Message content is required');
    }

    const sendAtDate = new Date(sendAt);
    if (Number.isNaN(sendAtDate.getTime())) {
      throw new BadRequestException('Invalid sendAt timestamp');
    }

    if (sendAtDate.getTime() < Date.now() + 5_000) {
      throw new BadRequestException('sendAt must be at least 5 seconds in the future');
    }

    const thread = threadId ? await this.ensureThreadInChannel(threadId, channelId) : null;

    return this.prisma.scheduledMessage.create({
      data: {
        workspaceId: channel.workspaceId,
        channelId,
        authorId: userId,
        threadId: thread?.id ?? null,
        parentMessageId: thread?.rootMessageId ?? null,
        content: normalizedContent,
        sendAt: sendAtDate,
        status: ScheduledMessageStatus.PENDING,
      },
    });
  }

  async listScheduledMessages(
    userId: string,
    workspaceId: string,
    channelId?: string,
    status?: ScheduledMessageStatus,
    cursor?: string,
    limit = 50,
  ) {
    await this.ensureWorkspaceMember(workspaceId, userId);
    if (channelId) {
      await this.ensureChannelAccess(channelId, userId);
    }

    const boundedLimit = this.normalizeLimit(limit, 50, 200);
    const data = await this.prisma.scheduledMessage.findMany({
      where: {
        authorId: userId,
        workspaceId,
        ...(channelId ? { channelId } : {}),
        ...(status ? { status } : {}),
      },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: boundedLimit,
      orderBy: [{ sendAt: 'asc' }, { id: 'asc' }],
      include: {
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      data,
      paging: {
        cursor: data.length === boundedLimit ? data[data.length - 1].id : null,
        limit: boundedLimit,
      },
    };
  }

  async cancelScheduledMessage(scheduledMessageId: string, userId: string) {
    const message = await this.prisma.scheduledMessage.findUnique({
      where: { id: scheduledMessageId },
      select: {
        id: true,
        authorId: true,
        status: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Scheduled message not found');
    }

    if (message.authorId !== userId) {
      throw new ForbiddenException('Cannot cancel another user scheduled message');
    }

    if (
      message.status === ScheduledMessageStatus.CANCELED ||
      message.status === ScheduledMessageStatus.SENT
    ) {
      return {
        id: message.id,
        status: message.status,
      };
    }

    return this.prisma.scheduledMessage.update({
      where: { id: scheduledMessageId },
      data: {
        status: ScheduledMessageStatus.CANCELED,
        canceledAt: new Date(),
      },
    });
  }

  private async processDueScheduledMessages() {
    if (this.schedulerTickInFlight) {
      return;
    }

    this.schedulerTickInFlight = true;
    try {
      const dueMessages = await this.prisma.scheduledMessage.findMany({
        where: {
          status: ScheduledMessageStatus.PENDING,
          sendAt: {
            lte: new Date(),
          },
        },
        orderBy: { sendAt: 'asc' },
        take: 20,
      });

      for (const dueMessage of dueMessages) {
        const claim = await this.prisma.scheduledMessage.updateMany({
          where: {
            id: dueMessage.id,
            status: ScheduledMessageStatus.PENDING,
          },
          data: {
            status: ScheduledMessageStatus.PROCESSING,
          },
        });

        if (claim.count !== 1) {
          continue;
        }

        try {
          const sent = await this.deliverScheduledMessage(dueMessage.id);
          await this.prisma.scheduledMessage.update({
            where: { id: dueMessage.id },
            data: {
              status: ScheduledMessageStatus.SENT,
              sentMessageId: sent.id,
              sentAt: new Date(),
              errorMessage: null,
            },
          });
        } catch (error) {
          await this.prisma.scheduledMessage.update({
            where: { id: dueMessage.id },
            data: {
              status: ScheduledMessageStatus.FAILED,
              errorMessage: this.errorMessage(error),
            },
          });
        }
      }
    } finally {
      this.schedulerTickInFlight = false;
    }
  }

  private async deliverScheduledMessage(scheduledMessageId: string) {
    const scheduled = await this.prisma.scheduledMessage.findUnique({
      where: { id: scheduledMessageId },
      select: {
        id: true,
        workspaceId: true,
        channelId: true,
        authorId: true,
        content: true,
        threadId: true,
        parentMessageId: true,
      },
    });

    if (!scheduled) {
      throw new NotFoundException('Scheduled message not found');
    }

    await this.ensureChannelAccess(scheduled.channelId, scheduled.authorId);

    let rootMessageId: string | null = scheduled.parentMessageId;
    if (scheduled.threadId) {
      const thread = await this.ensureThreadInChannel(
        scheduled.threadId,
        scheduled.channelId,
      );
      rootMessageId = thread.rootMessageId;
    }

    const message = await this.createMessageWithSequence({
      workspaceId: scheduled.workspaceId,
      channelId: scheduled.channelId,
      authorId: scheduled.authorId,
      threadId: scheduled.threadId,
      parentMessageId: rootMessageId,
      content: scheduled.content,
    });

    await this.emitMentionNotifications(
      scheduled.workspaceId,
      scheduled.channelId,
      await this.getChannelType(scheduled.channelId),
      scheduled.authorId,
      message.id,
      scheduled.content,
    );

    if (scheduled.threadId && rootMessageId) {
      await this.emitThreadReplyNotification(
        scheduled.workspaceId,
        scheduled.threadId,
        rootMessageId,
        scheduled.authorId,
        message.id,
      );
    }

    return message;
  }

  private async createMessageWithSequence(input: {
    workspaceId: string;
    channelId: string;
    authorId: string;
    content: string;
    threadId?: string | null;
    parentMessageId?: string | null;
  }) {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const latest = await this.prisma.message.findFirst({
        where: { channelId: input.channelId },
        orderBy: { sequence: 'desc' },
        select: { sequence: true },
      });

      const sequence = (latest?.sequence ?? BigInt(0)) + BigInt(1);

      try {
        return await this.prisma.message.create({
          data: {
            workspaceId: input.workspaceId,
            channelId: input.channelId,
            authorId: input.authorId,
            content: input.content,
            threadId: input.threadId ?? null,
            parentMessageId: input.parentMessageId ?? null,
            sequence,
          },
        });
      } catch (error) {
        if (this.isMessageSequenceConflict(error)) {
          continue;
        }
        throw error;
      }
    }

    throw new BadRequestException('Unable to allocate message sequence');
  }

  private isMessageSequenceConflict(error: unknown) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return false;
    }

    if (error.code !== 'P2002') {
      return false;
    }

    const target = error.meta?.target;
    if (Array.isArray(target)) {
      return target.includes('channelId') && target.includes('sequence');
    }

    if (typeof target === 'string') {
      return target.includes('channelId') && target.includes('sequence');
    }

    return true;
  }

  private async attachFilesToMessage(
    fileIds: string[],
    messageId: string,
    channelId: string,
    workspaceId: string,
    uploaderId: string,
  ) {
    const uniqueFileIds = [...new Set(fileIds)];
    const files = await this.prisma.file.findMany({
      where: {
        id: { in: uniqueFileIds },
      },
      select: {
        id: true,
        workspaceId: true,
        uploaderId: true,
      },
    });

    const allowedFileIds = files
      .filter(
        (file) =>
          file.workspaceId === workspaceId && file.uploaderId === uploaderId,
      )
      .map((file) => file.id);

    if (allowedFileIds.length === 0) {
      return;
    }

    await this.prisma.file.updateMany({
      where: {
        id: { in: allowedFileIds },
      },
      data: {
        messageId,
        channelId,
      },
    });
  }

  private async ensureMessageAccess(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.ensureChannelAccess(message.channelId, userId);
    return message;
  }

  private async ensureThreadInChannel(threadId: string, channelId: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        channelId: true,
        rootMessageId: true,
      },
    });

    if (!thread || thread.channelId !== channelId) {
      throw new NotFoundException('Thread not found');
    }

    return thread;
  }

  private async ensureChannelAccess(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        workspaceId: true,
        type: true,
        isArchived: true,
        members: {
          where: { userId },
          select: { userId: true },
          take: 1,
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.isArchived) {
      throw new ForbiddenException('Channel is archived');
    }

    await this.ensureWorkspaceMember(channel.workspaceId, userId);

    const requiresChannelMembership = channel.type !== ChannelType.PUBLIC;
    if (requiresChannelMembership && channel.members.length === 0) {
      throw new ForbiddenException('User is not a member of this channel');
    }

    return {
      id: channel.id,
      workspaceId: channel.workspaceId,
      type: channel.type,
    };
  }

  private async ensureWorkspaceMember(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    return membership.role;
  }

  private async getChannelType(channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        type: true,
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return channel.type;
  }

  private async getSerializedMessage(messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return this.serializeMessage(message);
  }

  private serializeMessage(message: MessageWithAuthor) {
    return {
      ...message,
      sequence: Number(message.sequence),
      author: message.author
        ? {
            id: message.author.id,
            displayName: message.author.displayName,
            email: message.author.email,
            avatarUrl: message.author.avatarUrl,
          }
        : undefined,
    };
  }

  private normalizeLimit(limit: number, fallback: number, max: number) {
    if (!Number.isFinite(limit)) {
      return fallback;
    }
    return Math.max(1, Math.min(limit, max));
  }

  private async emitMentionNotifications(
    workspaceId: string,
    channelId: string,
    channelType: ChannelType,
    actorId: string,
    messageId: string,
    content: string,
  ) {
    const handles = this.extractMentionHandles(content);
    if (handles.size === 0) {
      return;
    }

    const members = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        ...(channelType === ChannelType.PUBLIC
          ? {}
          : {
              user: {
                channelMembers: {
                  some: {
                    channelId,
                  },
                },
              },
            }),
      },
      select: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    const mentionedUserIds = new Set<string>();
    for (const member of members) {
      if (!member.user || member.user.id === actorId) {
        continue;
      }

      const handle = this.buildMentionHandle(
        member.user.displayName,
        member.user.email,
      );
      if (handles.has(handle)) {
        mentionedUserIds.add(member.user.id);
      }
    }

    if (mentionedUserIds.size === 0) {
      return;
    }

    await this.prisma.notification.createMany({
      data: [...mentionedUserIds].map((userId) => ({
        userId,
        workspaceId,
        type: 'MENTION',
        title: 'You were mentioned',
        body: 'Someone mentioned you in a channel conversation.',
        entityType: 'message',
        entityId: messageId,
        deliveryStatus: 'SENT',
      })),
    });
  }

  private async emitThreadReplyNotification(
    workspaceId: string,
    threadId: string,
    rootMessageId: string,
    actorId: string,
    messageId: string,
  ) {
    const rootMessage = await this.prisma.message.findUnique({
      where: { id: rootMessageId },
      select: {
        authorId: true,
      },
    });

    if (!rootMessage || rootMessage.authorId === actorId) {
      return;
    }

    await this.prisma.notification.create({
      data: {
        userId: rootMessage.authorId,
        workspaceId,
        type: 'THREAD_REPLY',
        title: 'New thread reply',
        body: 'Someone replied in a thread you participated in.',
        entityType: 'thread',
        entityId: threadId,
        deliveryStatus: 'SENT',
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: rootMessage.authorId,
        workspaceId,
        type: 'CHANNEL_ACTIVITY',
        title: 'Thread updated',
        body: 'There is new activity in a thread.',
        entityType: 'message',
        entityId: messageId,
        deliveryStatus: 'SENT',
      },
    });
  }

  private extractMentionHandles(content: string) {
    const handles = new Set<string>();
    const matcher = /(^|\s)@([a-zA-Z0-9._-]{2,64})\b/g;
    let match = matcher.exec(content);
    while (match) {
      handles.add(match[2].toLowerCase());
      match = matcher.exec(content);
    }
    return handles;
  }

  private buildMentionHandle(displayName: string, email: string) {
    const normalizedDisplayName = displayName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9._-]/g, '');

    if (normalizedDisplayName.length >= 2) {
      return normalizedDisplayName;
    }

    const localPart = email
      .split('@')[0]
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '');

    if (localPart && localPart.length >= 2) {
      return localPart;
    }

    return 'user';
  }

  private errorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message.slice(0, 500);
    }
    return 'Unknown error';
  }
}
