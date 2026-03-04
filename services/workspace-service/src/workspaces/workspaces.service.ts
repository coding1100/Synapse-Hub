import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

type Workspace = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

type WorkspaceMember = {
  workspaceId: string;
  userId: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: Date;
};

@Injectable()
export class WorkspacesService {
  private readonly workspaces = new Map<string, Workspace>();
  private readonly slugIndex = new Map<string, string>();
  private readonly membersByWorkspace = new Map<string, WorkspaceMember[]>();

  create(dto: CreateWorkspaceDto, ownerId: string) {
    if (this.slugIndex.has(dto.slug)) {
      throw new BadRequestException('Workspace slug already exists');
    }

    const workspace: Workspace = {
      id: uuidv4(),
      name: dto.name,
      slug: dto.slug,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.workspaces.set(workspace.id, workspace);
    this.slugIndex.set(workspace.slug, workspace.id);
    this.membersByWorkspace.set(workspace.id, [
      {
        workspaceId: workspace.id,
        userId: ownerId,
        email: `${ownerId}@synapsehub.local`,
        role: 'OWNER',
        joinedAt: new Date(),
      },
    ]);

    return workspace;
  }

  list(cursor?: string, limit = 20) {
    const boundedLimit = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 20, 100));
    const records = [...this.workspaces.values()].sort((a, b) => a.id.localeCompare(b.id));

    const startIdx = cursor ? Math.max(records.findIndex((w) => w.id === cursor) + 1, 0) : 0;
    const data = records.slice(startIdx, startIdx + boundedLimit);
    const nextCursor = data.length === boundedLimit ? data[data.length - 1].id : null;

    return {
      data,
      paging: {
        cursor: nextCursor,
        limit: boundedLimit,
      },
    };
  }

  members(workspaceId: string) {
    this.ensureWorkspace(workspaceId);
    return this.membersByWorkspace.get(workspaceId) ?? [];
  }

  invite(workspaceId: string, email: string, role: WorkspaceRole) {
    this.ensureWorkspace(workspaceId);
    const members = this.membersByWorkspace.get(workspaceId) ?? [];
    const existing = members.find((m) => m.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      existing.role = role;
      return existing;
    }

    const member: WorkspaceMember = {
      workspaceId,
      userId: uuidv4(),
      email: email.toLowerCase(),
      role,
      joinedAt: new Date(),
    };
    members.push(member);
    this.membersByWorkspace.set(workspaceId, members);
    return member;
  }

  setRole(workspaceId: string, userId: string, role: WorkspaceRole) {
    const members = this.membersByWorkspace.get(workspaceId) ?? [];
    const member = members.find((m) => m.userId === userId);
    if (!member) {
      throw new NotFoundException('Workspace member not found');
    }

    member.role = role;
    return member;
  }

  private ensureWorkspace(workspaceId: string) {
    if (!this.workspaces.has(workspaceId)) {
      throw new NotFoundException('Workspace not found');
    }
  }
}
