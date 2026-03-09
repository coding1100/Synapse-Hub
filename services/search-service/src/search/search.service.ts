import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { IndexDocumentDto } from './dto/index-document.dto';

type SearchType = 'message' | 'channel' | 'user' | 'file';

type SearchResult = {
  id: string;
  type: SearchType;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  cursor: string;
};

@Injectable()
export class SearchService {
  private readonly prisma = new PrismaClient();

  async index(dto: IndexDocumentDto, requesterUserId: string) {
    await this.ensureWorkspaceMember(dto.workspaceId, requesterUserId);

    return {
      indexed: false,
      reason: 'Search now queries primary storage directly; external indexing is optional.',
      received: {
        id: dto.id,
        type: dto.type,
      },
    };
  }

  async search(
    workspaceId: string,
    query: string,
    type?: SearchType,
    cursor?: string,
    limit = 20,
    requesterUserId?: string,
  ) {
    const boundedLimit = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 20, 100));
    const normalizedQuery = query.trim();

    if (requesterUserId) {
      await this.ensureWorkspaceMember(workspaceId, requesterUserId);
    }

    if (!normalizedQuery) {
      return {
        data: [],
        paging: {
          cursor: null,
          limit: boundedLimit,
        },
        total: 0,
      };
    }

    if (type === 'message') {
      return this.searchMessages(workspaceId, requesterUserId, normalizedQuery, cursor, boundedLimit);
    }

    if (type === 'channel') {
      return this.searchChannels(workspaceId, requesterUserId, normalizedQuery, cursor, boundedLimit);
    }

    if (type === 'user') {
      return this.searchUsers(workspaceId, normalizedQuery, cursor, boundedLimit);
    }

    if (type === 'file') {
      return this.searchFiles(workspaceId, normalizedQuery, cursor, boundedLimit);
    }

    const chunk = Math.max(1, Math.ceil(boundedLimit / 4));
    const [messages, channels, users, files] = await Promise.all([
      this.searchMessages(workspaceId, requesterUserId, normalizedQuery, undefined, chunk),
      this.searchChannels(workspaceId, requesterUserId, normalizedQuery, undefined, chunk),
      this.searchUsers(workspaceId, normalizedQuery, undefined, chunk),
      this.searchFiles(workspaceId, normalizedQuery, undefined, chunk),
    ]);

    const merged = [...messages.data, ...channels.data, ...users.data, ...files.data]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, boundedLimit);

    return {
      data: merged,
      paging: {
        cursor: merged.length === boundedLimit ? merged[merged.length - 1].cursor : null,
        limit: boundedLimit,
      },
      total: messages.total + channels.total + users.total + files.total,
    };
  }

  private async searchMessages(
    workspaceId: string,
    requesterUserId: string | undefined,
    query: string,
    cursor: string | undefined,
    limit: number,
  ) {
    const where: Prisma.MessageWhereInput = {
      workspaceId,
      deletedAt: null,
      content: {
        contains: query,
        mode: 'insensitive',
      },
    };

    if (requesterUserId) {
      where.OR = [
        {
          channel: {
            type: 'PUBLIC',
          },
        },
        {
          channel: {
            members: {
              some: {
                userId: requesterUserId,
              },
            },
          },
        },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          channelId: true,
          authorId: true,
          channel: {
            select: {
              id: true,
              name: true,
            },
          },
          author: {
            select: {
              id: true,
              displayName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.message.count({ where }),
    ]);

    const data: SearchResult[] = rows.map((row) => ({
      id: row.id,
      type: 'message',
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      cursor: row.id,
      metadata: {
        channelId: row.channelId,
        channelName: row.channel?.name,
        authorId: row.authorId,
        authorName: row.author?.displayName,
      },
    }));

    return {
      data,
      paging: {
        cursor: data.length === limit ? data[data.length - 1].cursor : null,
        limit,
      },
      total,
    };
  }

  private async searchChannels(
    workspaceId: string,
    requesterUserId: string | undefined,
    query: string,
    cursor: string | undefined,
    limit: number,
  ) {
    const where: Prisma.ChannelWhereInput = {
      workspaceId,
      isArchived: false,
      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          topic: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    };

    if (requesterUserId) {
      where.AND = [
        {
          OR: [
            { type: 'PUBLIC' },
            {
              members: {
                some: {
                  userId: requesterUserId,
                },
              },
            },
          ],
        },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.channel.findMany({
        where,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.channel.count({ where }),
    ]);

    const data: SearchResult[] = rows.map((row) => ({
      id: row.id,
      type: 'channel',
      content: `#${row.name}${row.topic ? ` - ${row.topic}` : ''}`,
      createdAt: row.createdAt.toISOString(),
      cursor: row.id,
      metadata: {
        workspaceId: row.workspaceId,
        channelType: row.type,
      },
    }));

    return {
      data,
      paging: {
        cursor: data.length === limit ? data[data.length - 1].cursor : null,
        limit,
      },
      total,
    };
  }

  private async searchUsers(workspaceId: string, query: string, cursor: string | undefined, limit: number) {
    const where: Prisma.UserWhereInput = {
      workspaceMembers: {
        some: {
          workspaceId,
        },
      },
      OR: [
        {
          displayName: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    };

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        take: limit,
        orderBy: { id: 'asc' },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data: SearchResult[] = rows.map((row) => ({
      id: row.id,
      type: 'user',
      content: `${row.displayName} (${row.email})`,
      createdAt: row.updatedAt.toISOString(),
      cursor: row.id,
      metadata: {
        email: row.email,
        displayName: row.displayName,
        avatarUrl: row.avatarUrl,
      },
    }));

    return {
      data,
      paging: {
        cursor: data.length === limit ? data[data.length - 1].cursor : null,
        limit,
      },
      total,
    };
  }

  private async searchFiles(workspaceId: string, query: string, cursor: string | undefined, limit: number) {
    const where: Prisma.FileWhereInput = {
      workspaceId,
      deletedAt: null,
      OR: [
        {
          filename: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          mimeType: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    };

    const [rows, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.file.count({ where }),
    ]);

    const data: SearchResult[] = rows.map((row) => ({
      id: row.id,
      type: 'file',
      content: row.filename,
      createdAt: row.createdAt.toISOString(),
      cursor: row.id,
      metadata: {
        mimeType: row.mimeType,
        size: row.size,
        channelId: row.channelId,
        url: row.url,
      },
    }));

    return {
      data,
      paging: {
        cursor: data.length === limit ? data[data.length - 1].cursor : null,
        limit,
      },
      total,
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
      select: { userId: true },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this workspace');
    }
  }
}
