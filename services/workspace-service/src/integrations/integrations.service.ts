import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationType, Prisma, PrismaClient, WorkspaceRole } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { CreateIntegrationDto } from './dto/create-integration.dto';

@Injectable()
export class IntegrationsService {
  private readonly prisma = new PrismaClient();

  async create(dto: CreateIntegrationDto) {
    if (!dto.createdById) {
      throw new ForbiddenException('Missing actor user id');
    }

    await this.ensureWorkspaceAdminOrOwner(dto.workspaceId, dto.createdById);

    const signingSecret = dto.secret ?? randomUUID().replace(/-/g, '');

    const integration = await this.prisma.integration.create({
      data: {
        workspaceId: dto.workspaceId,
        createdById: dto.createdById,
        type: dto.type,
        name: dto.name,
        config: dto.config as Prisma.InputJsonValue,
        secret: this.hash(signingSecret),
      },
    });

    const { secret: _, ...publicIntegration } = integration;

    return {
      ...publicIntegration,
      signingSecret,
    };
  }

  async list(workspaceId: string, requesterId: string, type?: IntegrationType) {
    await this.ensureWorkspaceAdminOrOwner(workspaceId, requesterId);

    return this.prisma.integration.findMany({
      where: {
        workspaceId,
        type: type ?? {
          in: [IntegrationType.WEBHOOK, IntegrationType.CUSTOM],
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        workspaceId: true,
        createdById: true,
        type: true,
        name: true,
        config: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async handleWebhookEvent(
    integrationId: string,
    payload: Record<string, unknown>,
    providedSecret: string,
  ) {
    const integration = await this.ensureIntegration(integrationId, providedSecret);

    await this.prisma.auditLog.create({
      data: {
        workspaceId: integration.workspaceId,
        actorId: integration.createdById,
        action: 'INTEGRATION_EVENT',
        targetType: 'integration:webhook',
        targetId: integration.id,
        metadata: payload as Prisma.InputJsonValue,
      },
    });

    return {
      accepted: true,
      provider: 'webhook',
      integrationId,
    };
  }

  async handleCustomEvent(
    integrationId: string,
    event: string,
    payload: Record<string, unknown>,
    providedSecret: string,
  ) {
    const integration = await this.ensureIntegration(integrationId, providedSecret);

    await this.prisma.auditLog.create({
      data: {
        workspaceId: integration.workspaceId,
        actorId: integration.createdById,
        action: 'INTEGRATION_EVENT',
        targetType: 'integration:custom',
        targetId: integration.id,
        metadata: {
          event,
          payload,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      accepted: true,
      provider: 'custom',
      event,
      integrationId,
    };
  }

  private async ensureWorkspaceAdminOrOwner(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: { role: true },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this workspace');
    }

    if (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Only owner or admin can manage integrations');
    }
  }

  private async ensureIntegration(integrationId: string, providedSecret: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.isActive) {
      throw new NotFoundException('Integration not found or inactive');
    }

    if (!integration.secret) {
      throw new ForbiddenException('Integration secret is not configured');
    }

    if (integration.secret !== this.hash(providedSecret)) {
      throw new ForbiddenException('Invalid integration secret');
    }

    return integration;
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
