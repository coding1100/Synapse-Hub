import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateChannelDto } from './dto/create-channel.dto';

@Injectable()
export class ChannelsService {
  private readonly prisma = new PrismaClient();

  async create(dto: CreateChannelDto) {
    const creatorId = dto.createdById ?? 'system-user';

    await this.prisma.user.upsert({
      where: { id: creatorId },
      create: {
        id: creatorId,
        email: `${creatorId}@synapsehub.local`,
        displayName: `user-${creatorId.slice(0, 6)}`,
      },
      update: {},
    });

    return this.prisma.channel.create({
      data: {
        workspaceId: dto.workspaceId,
        createdById: creatorId,
        name: dto.name,
        topic: dto.topic,
        type: dto.isPrivate ? 'PRIVATE' : 'PUBLIC',
      },
    });
  }

  async list(workspaceId: string, cursor?: string, limit = 50) {
    const normalizedLimit = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 50, 200));

    const data = await this.prisma.channel.findMany({
      where: { workspaceId },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: normalizedLimit,
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });

    return {
      data,
      paging: {
        cursor: data.length === normalizedLimit ? data[data.length - 1].id : null,
        limit: normalizedLimit,
      },
    };
  }

  async join(channelId: string, userId: string) {
    await this.ensureChannel(channelId);

    await this.prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: `${userId}@synapsehub.local`,
        displayName: `user-${userId.slice(0, 6)}`,
      },
      update: {},
    });

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
    await this.ensureChannel(channelId);

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

  async archive(channelId: string) {
    await this.ensureChannel(channelId);

    return this.prisma.channel.update({
      where: { id: channelId },
      data: {
        isArchived: true,
      },
    });
  }

  private async ensureChannel(channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { id: true },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
  }
}