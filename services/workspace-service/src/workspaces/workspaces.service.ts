import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, WorkspaceRole } from '@prisma/client';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Injectable()
export class WorkspacesService {
  private readonly prisma = new PrismaClient();

  async create(dto: CreateWorkspaceDto, ownerId: string) {
    const owner = await this.prisma.user.upsert({
      where: { id: ownerId },
      create: {
        id: ownerId,
        email: `${ownerId}@synapsehub.local`,
        displayName: `user-${ownerId.slice(0, 6)}`,
      },
      update: {},
    });

    try {
      const workspace = await this.prisma.workspace.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          ownerId: owner.id,
          members: {
            create: {
              userId: owner.id,
              role: 'OWNER',
            },
          },
        },
      });

      await this.prisma.auditLog.create({
        data: {
          workspaceId: workspace.id,
          actorId: owner.id,
          action: 'CREATE',
          targetType: 'workspace',
          targetId: workspace.id,
        },
      });

      return workspace;
    } catch {
      throw new BadRequestException('Workspace slug already exists');
    }
  }

  async list(cursor?: string, limit = 20) {
    const boundedLimit = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 20, 100));

    const data = await this.prisma.workspace.findMany({
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: boundedLimit,
      orderBy: { id: 'asc' },
    });

    return {
      data,
      paging: {
        cursor: data.length === boundedLimit ? data[data.length - 1].id : null,
        limit: boundedLimit,
      },
    };
  }

  async members(workspaceId: string) {
    await this.ensureWorkspace(workspaceId);

    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
  }

  async invite(workspaceId: string, email: string, role: WorkspaceRole) {
    await this.ensureWorkspace(workspaceId);

    const user = await this.prisma.user.upsert({
      where: { email: email.toLowerCase() },
      create: {
        email: email.toLowerCase(),
        displayName: email.split('@')[0],
      },
      update: {},
    });

    return this.prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
      create: {
        workspaceId,
        userId: user.id,
        role,
      },
      update: {
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });
  }

  async setRole(workspaceId: string, userId: string, role: WorkspaceRole) {
    await this.ensureWorkspace(workspaceId);

    try {
      return await this.prisma.workspaceMember.update({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId,
          },
        },
        data: { role },
      });
    } catch {
      throw new NotFoundException('Workspace member not found');
    }
  }

  private async ensureWorkspace(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
  }
}