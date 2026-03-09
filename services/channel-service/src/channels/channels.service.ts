import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient, WorkspaceRole } from '@prisma/client';
import { CreateChannelDto } from './dto/create-channel.dto';

@Injectable()
export class ChannelsService {
  private readonly prisma = new PrismaClient();

  async create(dto: CreateChannelDto, creatorId: string) {
    const workspaceMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: dto.workspaceId,
          userId: creatorId,
        },
      },
      select: { userId: true },
    });

    if (!workspaceMembership) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    const requestedMemberIds = [...new Set((dto.memberIds ?? []).map((id) => id.trim()))]
      .filter((id) => id.length > 0)
      .filter((id) => id !== creatorId);

    if (requestedMemberIds.length > 0) {
      await this.ensureWorkspaceUsers(dto.workspaceId, requestedMemberIds);
    }

    const channelType = requestedMemberIds.length > 0 || dto.isPrivate ? 'PRIVATE' : 'PUBLIC';
    const members = [creatorId, ...requestedMemberIds];

    try {
      return await this.prisma.channel.create({
        data: {
          workspaceId: dto.workspaceId,
          createdById: creatorId,
          name: dto.name.trim(),
          topic: dto.topic?.trim() || null,
          type: channelType,
          members: {
            create: members.map((userId) => ({ userId })),
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Channel name already exists in this workspace');
      }
      throw error;
    }
  }

  async createDirectChannel(workspaceId: string, requesterId: string, targetUserId: string) {
    const normalizedTargetUserId = targetUserId.trim();
    if (!normalizedTargetUserId) {
      throw new BadRequestException('targetUserId is required');
    }

    if (normalizedTargetUserId === requesterId) {
      throw new BadRequestException('Cannot create direct channel with yourself');
    }

    await this.ensureWorkspaceUsers(workspaceId, [requesterId, normalizedTargetUserId]);

    const existing = await this.findDirectChannel(workspaceId, requesterId, normalizedTargetUserId);
    if (existing) {
      return existing;
    }

    try {
      return await this.prisma.channel.create({
        data: {
          workspaceId,
          createdById: requesterId,
          type: 'DIRECT',
          name: this.directChannelName(requesterId, normalizedTargetUserId),
          members: {
            create: [{ userId: requesterId }, { userId: normalizedTargetUserId }],
          },
        },
        include: {
          _count: {
            select: {
              members: true,
              messages: true,
            },
          },
          members: {
            select: {
              userId: true,
              user: {
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
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const channel = await this.findDirectChannel(workspaceId, requesterId, normalizedTargetUserId);
        if (channel) {
          return channel;
        }
      }
      throw error;
    }
  }

  async list(workspaceId: string, userId: string, cursor?: string, limit = 50) {
    const normalizedLimit = Math.max(
      1,
      Math.min(Number.isFinite(limit) ? limit : 50, 200),
    );

    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: { userId: true },
    });

    if (!workspaceMember) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    const data = await this.prisma.channel.findMany({
      where: {
        workspaceId,
        isArchived: false,
        OR: [
          { type: 'PUBLIC' },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: normalizedLimit,
      orderBy: [{ type: 'asc' }, { name: 'asc' }, { id: 'asc' }],
      include: {
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });

    const directChannelIds = data.filter((channel) => channel.type === 'DIRECT').map((channel) => channel.id);

    const directMembers = directChannelIds.length > 0
      ? await this.prisma.channelMember.findMany({
          where: {
            channelId: {
              in: directChannelIds,
            },
          },
          select: {
            channelId: true,
            userId: true,
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        })
      : [];

    const directMembersByChannel = new Map<string, typeof directMembers>();
    for (const member of directMembers) {
      const bucket = directMembersByChannel.get(member.channelId) ?? [];
      bucket.push(member);
      directMembersByChannel.set(member.channelId, bucket);
    }

    return {
      data: data.map((channel) => ({
        ...channel,
        members: channel.type === 'DIRECT' ? directMembersByChannel.get(channel.id) ?? [] : [],
      })),
      paging: {
        cursor: data.length === normalizedLimit ? data[data.length - 1].id : null,
        limit: normalizedLimit,
      },
    };
  }

  async join(channelId: string, userId: string) {
    const channel = await this.ensureChannel(channelId);

    if (channel.type !== 'PUBLIC') {
      throw new ForbiddenException('Private and direct channels cannot be joined directly');
    }

    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId,
        },
      },
      select: { userId: true },
    });
    if (!workspaceMember) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    const membership = await this.prisma.channelMember.upsert({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
      create: {
        channelId,
        userId,
      },
      update: {},
    });

    const members = await this.prisma.channelMember.count({ where: { channelId } });

    return {
      ...membership,
      joined: true,
      members,
    };
  }

  async leave(channelId: string, userId: string) {
    const channel = await this.ensureChannel(channelId);

    if (channel.type === 'DIRECT') {
      throw new ForbiddenException('Direct channels cannot be left');
    }

    await this.prisma.channelMember.deleteMany({
      where: {
        channelId,
        userId,
      },
    });

    const members = await this.prisma.channelMember.count({ where: { channelId } });

    return {
      channelId,
      userId,
      joined: false,
      members,
    };
  }

  async archive(channelId: string, actorId: string) {
    const channel = await this.ensureChannel(channelId);

    if (channel.type === 'DIRECT') {
      throw new BadRequestException('Direct channels cannot be archived');
    }

    const actorMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: channel.workspaceId,
          userId: actorId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!actorMembership) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    const canArchive =
      actorMembership.role === WorkspaceRole.OWNER ||
      actorMembership.role === WorkspaceRole.ADMIN ||
      channel.createdById === actorId;

    if (!canArchive) {
      throw new ForbiddenException('Only admins, owners, or channel creator can archive');
    }

    return this.prisma.channel.update({
      where: { id: channelId },
      data: {
        isArchived: true,
      },
    });
  }

  private async findDirectChannel(workspaceId: string, requesterId: string, targetUserId: string) {
    return this.prisma.channel.findFirst({
      where: {
        workspaceId,
        type: 'DIRECT',
        isArchived: false,
        AND: [
          {
            members: {
              some: {
                userId: requesterId,
              },
            },
          },
          {
            members: {
              some: {
                userId: targetUserId,
              },
            },
          },
          {
            NOT: {
              members: {
                some: {
                  userId: {
                    notIn: [requesterId, targetUserId],
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
        members: {
          select: {
            userId: true,
            user: {
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
  }

  private directChannelName(userA: string, userB: string) {
    const [left, right] = [userA, userB].sort((a, b) => a.localeCompare(b));
    return `dm:${left}:${right}`;
  }

  private async ensureWorkspaceUsers(workspaceId: string, userIds: string[]) {
    const normalizedUserIds = [...new Set(userIds)];
    const members = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        userId: {
          in: normalizedUserIds,
        },
      },
      select: {
        userId: true,
      },
    });

    if (members.length !== normalizedUserIds.length) {
      throw new NotFoundException('One or more selected users are not in this workspace');
    }
  }

  private async ensureChannel(channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { id: true, workspaceId: true, type: true, createdById: true },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    return channel;
  }
}
