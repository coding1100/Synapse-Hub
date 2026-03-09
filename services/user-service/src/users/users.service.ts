import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly prisma = new PrismaClient();

  async getOrCreateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        lastSeenAt: new Date(),
      },
    });
  }

  async createInternal(email: string, displayName: string) {
    return this.prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        displayName,
      },
    });
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateById(id: string, dto: UpdateUserDto) {
    await this.getById(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        displayName: dto.displayName,
        title: dto.title,
        timezone: dto.timezone,
      },
    });
  }

  async search(q?: string, cursor?: string, limit = 20, workspaceId?: string, requesterId?: string) {
    const normalizedLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 20;

    if (workspaceId && requesterId) {
      await this.ensureWorkspaceMember(workspaceId, requesterId);
    }

    const data = await this.prisma.user.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { displayName: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(workspaceId
          ? {
              workspaceMembers: {
                some: {
                  workspaceId,
                },
              },
            }
          : {}),
      },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: normalizedLimit,
      orderBy: { id: 'asc' },
    });

    return {
      data,
      paging: {
        cursor: data.length === normalizedLimit ? data[data.length - 1].id : null,
        limit: normalizedLimit,
      },
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
        userId: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this workspace');
    }
  }
}
