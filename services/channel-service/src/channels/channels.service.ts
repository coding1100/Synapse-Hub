import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateChannelDto } from './dto/create-channel.dto';

type Channel = {
  id: string;
  workspaceId: string;
  name: string;
  topic?: string;
  isPrivate: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ChannelsService {
  private readonly channels = new Map<string, Channel>();
  private readonly memberIndex = new Map<string, Set<string>>();

  create(dto: CreateChannelDto) {
    const channel: Channel = {
      id: uuidv4(),
      workspaceId: dto.workspaceId,
      name: dto.name,
      topic: dto.topic,
      isPrivate: dto.isPrivate ?? false,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.channels.set(channel.id, channel);
    this.memberIndex.set(channel.id, new Set());

    return channel;
  }

  list(workspaceId: string, cursor?: string, limit = 50) {
    const normalizedLimit = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 50, 200));
    const rows = [...this.channels.values()]
      .filter((c) => c.workspaceId === workspaceId)
      .sort((a, b) => a.id.localeCompare(b.id));

    const startIdx = cursor ? Math.max(rows.findIndex((c) => c.id === cursor) + 1, 0) : 0;
    const data = rows.slice(startIdx, startIdx + normalizedLimit);

    return {
      data,
      paging: {
        cursor: data.length === normalizedLimit ? data[data.length - 1].id : null,
        limit: normalizedLimit,
      },
    };
  }

  join(channelId: string, userId: string) {
    this.ensureChannel(channelId);
    const members = this.memberIndex.get(channelId) ?? new Set<string>();
    members.add(userId);
    this.memberIndex.set(channelId, members);
    return {
      channelId,
      userId,
      joined: true,
      members: members.size,
    };
  }

  leave(channelId: string, userId: string) {
    this.ensureChannel(channelId);
    const members = this.memberIndex.get(channelId) ?? new Set<string>();
    members.delete(userId);
    this.memberIndex.set(channelId, members);
    return {
      channelId,
      userId,
      joined: false,
      members: members.size,
    };
  }

  archive(channelId: string) {
    const channel = this.ensureChannel(channelId);
    channel.isArchived = true;
    channel.updatedAt = new Date();
    return channel;
  }

  private ensureChannel(channelId: string): Channel {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }
    return channel;
  }
}
