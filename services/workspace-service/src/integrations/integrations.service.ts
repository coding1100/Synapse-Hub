import { Injectable, NotFoundException } from '@nestjs/common';
import { IntegrationType, Prisma, PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { CreateIntegrationDto } from './dto/create-integration.dto';

@Injectable()
export class IntegrationsService {
  private readonly prisma = new PrismaClient();

  async create(dto: CreateIntegrationDto) {
    await this.ensureWorkspace(dto.workspaceId);

    await this.prisma.user.upsert({
      where: { id: dto.createdById },
      create: {
        id: dto.createdById,
        email: `${dto.createdById}@synapsehub.local`,
        displayName: `user-${dto.createdById.slice(0, 6)}`,
      },
      update: {},
    });

    return this.prisma.integration.create({
      data: {
        workspaceId: dto.workspaceId,
        createdById: dto.createdById,
        type: dto.type,
        name: dto.name,
        config: dto.config as Prisma.InputJsonValue,
        secret: dto.secret ? this.hash(dto.secret) : undefined,
      },
    });
  }

  async list(workspaceId: string, type?: IntegrationType) {
    return this.prisma.integration.findMany({
      where: {
        workspaceId,
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async handleGithubEvent(
    integrationId: string,
    event: string,
    payload: Record<string, unknown>,
  ) {
    const integration = await this.ensureIntegration(integrationId);

    await this.prisma.auditLog.create({
      data: {
        workspaceId: integration.workspaceId,
        actorId: integration.createdById,
        action: 'INTEGRATION_EVENT',
        targetType: 'integration:github',
        targetId: integration.id,
        metadata: {
          event,
          payload,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      accepted: true,
      provider: 'github',
      event,
      integrationId,
    };
  }

  async handleWebhookEvent(integrationId: string, payload: Record<string, unknown>) {
    const integration = await this.ensureIntegration(integrationId);

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
  ) {
    const integration = await this.ensureIntegration(integrationId);

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

  private async ensureWorkspace(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
  }

  private async ensureIntegration(integrationId: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.isActive) {
      throw new NotFoundException('Integration not found or inactive');
    }

    return integration;
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
