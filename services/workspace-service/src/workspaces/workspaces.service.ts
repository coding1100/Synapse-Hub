import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient, WorkspaceRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { CreateInviteLinkDto } from './dto/create-invite-link.dto';
import { EmailDeliveryService } from './email-delivery.service';

@Injectable()
export class WorkspacesService {
  private readonly prisma = new PrismaClient();
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(private readonly emailDelivery: EmailDeliveryService) {}

  async create(dto: CreateWorkspaceDto, ownerId: string) {
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true },
    });

    if (!owner) {
      throw new NotFoundException('Owner user not found');
    }

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

  async list(userId: string, cursor?: string, limit = 20) {
    const boundedLimit = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 20, 100));

    const data = await this.prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: boundedLimit,
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: {
            members: true,
            channels: true,
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

  async members(workspaceId: string, requesterId: string) {
    await this.ensureWorkspaceMember(workspaceId, requesterId);

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

  async invite(workspaceId: string, email: string, role: WorkspaceRole, actorId: string) {
    const actorMembership = await this.ensureWorkspaceMember(workspaceId, actorId);
    this.ensureCanManageMembers(actorMembership.role);

    if (role === WorkspaceRole.OWNER && actorMembership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only owner can invite another owner');
    }

    const normalizedEmail = this.normalizeEmail(email);
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true, slug: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, displayName: true },
    });

    if (existingUser) {
      const membership = await this.prisma.workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: existingUser.id,
          },
        },
        create: {
          workspaceId,
          userId: existingUser.id,
          role,
          invitedById: actorId,
        },
        update: {
          role,
          invitedById: actorId,
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

      void this.sendMemberAddedEmail(normalizedEmail, workspace.name).catch((error) =>
        this.logger.warn(`Member invite email failed for workspace=${workspaceId}: ${this.errorMessage(error)}`),
      );

      return {
        mode: 'MEMBER_ADDED',
        member: membership,
      };
    }

    const inviteLink = await this.createInviteLinkEntity(workspaceId, actorId, {
      role,
      expiresInHours: 72,
      maxUses: 1,
      invitedEmail: normalizedEmail,
    });

    void this.sendInviteLinkEmail(normalizedEmail, workspace.name, inviteLink.code).catch((error) =>
      this.logger.warn(`Invite link email failed for workspace=${workspaceId}: ${this.errorMessage(error)}`),
    );

    return {
      mode: 'LINK_SENT',
      email: normalizedEmail,
      inviteLink: this.serializeInviteLink(inviteLink),
    };
  }

  async createInviteLink(workspaceId: string, actorId: string, dto: CreateInviteLinkDto) {
    await this.ensureWorkspaceManager(workspaceId, actorId, dto.role ?? 'MEMBER');
    const inviteLink = await this.createInviteLinkEntity(workspaceId, actorId, {
      role: dto.role ?? 'MEMBER',
      expiresInHours: dto.expiresInHours ?? 72,
      maxUses: dto.maxUses ?? null,
      invitedEmail: null,
      allowedDomain: dto.allowedDomain,
    });

    return this.serializeInviteLink(inviteLink);
  }

  async listInviteLinks(workspaceId: string, actorId: string) {
    await this.ensureWorkspaceManager(workspaceId, actorId, 'MEMBER');

    const links = await this.prisma.workspaceInviteLink.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        invitedBy: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    return links.map((link) => this.serializeInviteLink(link));
  }

  async revokeInviteLink(workspaceId: string, inviteLinkId: string, actorId: string) {
    const actorMembership = await this.ensureWorkspaceManager(workspaceId, actorId, 'MEMBER');

    const inviteLink = await this.prisma.workspaceInviteLink.findUnique({
      where: { id: inviteLinkId },
      select: {
        id: true,
        workspaceId: true,
        role: true,
        isRevoked: true,
      },
    });

    if (!inviteLink || inviteLink.workspaceId !== workspaceId) {
      throw new NotFoundException('Invite link not found');
    }

    if (inviteLink.role === WorkspaceRole.OWNER && actorMembership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only owner can revoke owner invite links');
    }

    const updated = await this.prisma.workspaceInviteLink.update({
      where: { id: inviteLinkId },
      data: { isRevoked: true },
    });

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorId,
        action: 'UPDATE',
        targetType: 'workspace_invite_link',
        targetId: inviteLinkId,
        metadata: {
          isRevoked: true,
        },
      },
    });

    return this.serializeInviteLink(updated);
  }

  async acceptInviteLink(code: string, userId: string) {
    const inviteCode = code.trim();
    if (!inviteCode) {
      throw new BadRequestException('Invite code is required');
    }

    const inviteLink = await this.prisma.workspaceInviteLink.findUnique({
      where: { code: inviteCode },
      select: {
        id: true,
        workspaceId: true,
        invitedById: true,
        role: true,
        maxUses: true,
        useCount: true,
        expiresAt: true,
        allowedDomain: true,
        invitedEmail: true,
        isRevoked: true,
      },
    });

    if (!inviteLink) {
      throw new NotFoundException('Invite link not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.ensureInviteLinkCanBeAccepted(inviteLink);
    this.ensureInviteRecipientMatches(inviteLink, user.email);

    const existingAcceptance = await this.prisma.workspaceInviteAcceptance.findUnique({
      where: {
        inviteLinkId_userId: {
          inviteLinkId: inviteLink.id,
          userId,
        },
      },
      select: { id: true },
    });

    if (existingAcceptance) {
      const membership = await this.prisma.workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: inviteLink.workspaceId,
            userId,
          },
        },
        create: {
          workspaceId: inviteLink.workspaceId,
          userId,
          role: inviteLink.role,
          invitedById: inviteLink.invitedById,
        },
        update: {},
        select: {
          workspaceId: true,
          role: true,
        },
      });

      return {
        success: true,
        alreadyAccepted: true,
        workspaceId: membership.workspaceId,
        role: membership.role,
      };
    }

    const now = new Date();
    const accepted = await this.prisma.$transaction(async (tx) => {
      const reserve = await tx.workspaceInviteLink.updateMany({
        where: {
          id: inviteLink.id,
          isRevoked: false,
          expiresAt: { gt: now },
          OR: [
            { maxUses: null },
            { useCount: { lt: inviteLink.maxUses ?? 0 } },
          ],
        },
        data: {
          useCount: { increment: 1 },
        },
      });

      if (reserve.count !== 1) {
        throw new BadRequestException('Invite link is unavailable');
      }

      const membership = await tx.workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: inviteLink.workspaceId,
            userId,
          },
        },
        create: {
          workspaceId: inviteLink.workspaceId,
          userId,
          role: inviteLink.role,
          invitedById: inviteLink.invitedById,
        },
        update: {},
        select: {
          workspaceId: true,
          role: true,
        },
      });

      await tx.workspaceInviteAcceptance.create({
        data: {
          inviteLinkId: inviteLink.id,
          workspaceId: inviteLink.workspaceId,
          userId,
        },
      });

      await tx.auditLog.create({
        data: {
          workspaceId: inviteLink.workspaceId,
          actorId: userId,
          action: 'INVITE',
          targetType: 'workspace_invite_accept',
          targetId: inviteLink.id,
          metadata: {
            role: inviteLink.role,
          },
        },
      });

      return membership;
    });

    return {
      success: true,
      alreadyAccepted: false,
      workspaceId: accepted.workspaceId,
      role: accepted.role,
    };
  }

  async setRole(workspaceId: string, userId: string, role: WorkspaceRole, actorId: string) {
    const actorMembership = await this.ensureWorkspaceMember(workspaceId, actorId);
    this.ensureCanManageMembers(actorMembership.role);

    const targetMembership = await this.ensureWorkspaceMember(workspaceId, userId);

    if (targetMembership.role === 'OWNER' && actorMembership.role !== 'OWNER') {
      throw new ForbiddenException('Only owner can update owner role');
    }

    return this.prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      data: { role },
    });
  }

  private async createInviteLinkEntity(
    workspaceId: string,
    actorId: string,
    options: {
      role: WorkspaceRole;
      expiresInHours: number;
      maxUses: number | null;
      invitedEmail?: string | null;
      allowedDomain?: string;
    },
  ) {
    const allowedDomain = this.normalizeDomain(options.allowedDomain);
    const invitedEmail = options.invitedEmail ? this.normalizeEmail(options.invitedEmail) : null;
    const code = await this.generateUniqueInviteCode();
    const expiresAt = new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000);

    const inviteLink = await this.prisma.workspaceInviteLink.create({
      data: {
        workspaceId,
        invitedById: actorId,
        code,
        invitedEmail,
        role: options.role,
        maxUses: options.maxUses,
        expiresAt,
        allowedDomain,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        actorId,
        action: 'INVITE',
        targetType: 'workspace_invite_link',
        targetId: inviteLink.id,
        metadata: {
          role: options.role,
          maxUses: options.maxUses,
          expiresAt,
          allowedDomain,
          invitedEmail,
        },
      },
    });

    return inviteLink;
  }

  private serializeInviteLink(
    inviteLink: {
      id: string;
      workspaceId: string;
      code: string;
      role: WorkspaceRole;
      maxUses: number | null;
      useCount: number;
      expiresAt: Date;
      allowedDomain: string | null;
      invitedEmail: string | null;
      isRevoked: boolean;
      createdAt: Date;
      updatedAt: Date;
      invitedBy?: {
        id: string;
        email: string;
        displayName: string;
      };
    },
  ) {
    return {
      id: inviteLink.id,
      workspaceId: inviteLink.workspaceId,
      role: inviteLink.role,
      maxUses: inviteLink.maxUses,
      useCount: inviteLink.useCount,
      expiresAt: inviteLink.expiresAt,
      allowedDomain: inviteLink.allowedDomain,
      invitedEmail: inviteLink.invitedEmail,
      isRevoked: inviteLink.isRevoked,
      createdAt: inviteLink.createdAt,
      updatedAt: inviteLink.updatedAt,
      inviteUrl: `${this.publicWebUrl()}/invite/${inviteLink.code}`,
      invitedBy: inviteLink.invitedBy,
    };
  }

  private ensureInviteLinkCanBeAccepted(inviteLink: {
    isRevoked: boolean;
    expiresAt: Date;
    maxUses: number | null;
    useCount: number;
  }) {
    if (inviteLink.isRevoked) {
      throw new BadRequestException('Invite link has been revoked');
    }

    if (inviteLink.expiresAt <= new Date()) {
      throw new BadRequestException('Invite link has expired');
    }

    if (inviteLink.maxUses !== null && inviteLink.useCount >= inviteLink.maxUses) {
      throw new BadRequestException('Invite link usage limit reached');
    }
  }

  private ensureInviteRecipientMatches(
    inviteLink: {
      invitedEmail: string | null;
      allowedDomain: string | null;
    },
    userEmail: string,
  ) {
    const normalizedEmail = this.normalizeEmail(userEmail);

    if (inviteLink.invitedEmail && inviteLink.invitedEmail !== normalizedEmail) {
      throw new ForbiddenException('Invite link is limited to a different email address');
    }

    if (inviteLink.allowedDomain) {
      const domain = normalizedEmail.split('@')[1] ?? '';
      if (domain.toLowerCase() !== inviteLink.allowedDomain.toLowerCase()) {
        throw new ForbiddenException('Invite link is restricted to a specific email domain');
      }
    }
  }

  private async ensureWorkspaceManager(
    workspaceId: string,
    userId: string,
    inviteRole: WorkspaceRole,
  ) {
    const membership = await this.ensureWorkspaceMember(workspaceId, userId);
    this.ensureCanManageMembers(membership.role);

    if (inviteRole === WorkspaceRole.OWNER && membership.role !== WorkspaceRole.OWNER) {
      throw new ForbiddenException('Only owner can invite another owner');
    }

    return membership;
  }

  private async ensureWorkspaceMember(workspaceId: string, userId: string) {
    await this.ensureWorkspace(workspaceId);

    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: {
        workspaceId: true,
        userId: true,
        role: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    return membership;
  }

  private ensureCanManageMembers(role: WorkspaceRole) {
    if (role !== 'OWNER' && role !== 'ADMIN') {
      throw new ForbiddenException('User does not have permission to manage members');
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

  private async sendInviteLinkEmail(email: string, workspaceName: string, code: string) {
    const inviteUrl = `${this.publicWebUrl()}/invite/${code}`;
    await this.emailDelivery.send({
      to: email,
      subject: `Invitation to join ${workspaceName} on SynapseHub`,
      text: `You were invited to join ${workspaceName}. Accept invitation: ${inviteUrl}`,
      html: `<p>You were invited to join <strong>${this.escapeHtml(workspaceName)}</strong>.</p><p>Accept invitation: <a href="${inviteUrl}">${inviteUrl}</a></p>`,
    });
  }

  private async sendMemberAddedEmail(email: string, workspaceName: string) {
    const workspaceUrl = `${this.publicWebUrl()}/workspace`;
    await this.emailDelivery.send({
      to: email,
      subject: `You were added to ${workspaceName} on SynapseHub`,
      text: `You were added to ${workspaceName}. Open workspace settings: ${workspaceUrl}`,
      html: `<p>You were added to <strong>${this.escapeHtml(workspaceName)}</strong>.</p><p>Open workspace settings: <a href="${workspaceUrl}">${workspaceUrl}</a></p>`,
    });
  }

  private async generateUniqueInviteCode() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = randomBytes(18).toString('base64url');
      const existing = await this.prisma.workspaceInviteLink.findUnique({
        where: { code },
        select: { id: true },
      });
      if (!existing) {
        return code;
      }
    }

    throw new BadRequestException('Unable to generate invite link');
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizeDomain(domain?: string) {
    if (!domain) {
      return null;
    }

    const normalized = domain.trim().toLowerCase().replace(/^@/, '');
    return normalized || null;
  }

  private publicWebUrl() {
    const baseUrl = process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000';
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private errorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    return 'unknown error';
  }
}
