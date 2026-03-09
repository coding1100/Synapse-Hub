import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient, WorkspaceRole } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { CreateBotDto } from './dto/create-bot.dto';
import { BotEventDto } from './dto/bot-event.dto';
import { executeSlashCommand } from './command-runner';

@Injectable()
export class BotsService {
  private readonly prisma = new PrismaClient();

  async create(dto: CreateBotDto) {
    if (!dto.createdById) {
      throw new ForbiddenException('Missing actor user id');
    }

    await this.ensureWorkspaceAdminOrOwner(dto.workspaceId, dto.createdById);

    const token = `shb_${randomUUID().replace(/-/g, '')}`;

    const bot = await this.prisma.bot.create({
      data: {
        workspaceId: dto.workspaceId,
        createdById: dto.createdById,
        name: dto.name,
        description: dto.description,
        tokenHash: this.hash(token),
        scopes: dto.scopes ?? ['messages:write', 'events:read', 'commands:execute'],
      },
    });

    return {
      ...bot,
      token,
    };
  }

  async list(workspaceId: string, requesterId: string) {
    await this.ensureWorkspaceAdminOrOwner(workspaceId, requesterId);

    return this.prisma.bot.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        workspaceId: true,
        createdById: true,
        name: true,
        description: true,
        scopes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async recordEvent(botId: string, dto: BotEventDto, botToken: string) {
    const bot = await this.authenticateBot(botId, botToken, 'events:read');

    const event = await this.prisma.botEvent.create({
      data: {
        workspaceId: bot.workspaceId,
        botId: bot.id,
        actorId: dto.actorId,
        type: dto.type,
        payload: dto.payload as Prisma.InputJsonValue,
      },
    });

    return {
      accepted: true,
      event,
    };
  }

  async runSlashCommand(botId: string, channelId: string, command: string, botToken: string) {
    const bot = await this.authenticateBot(botId, botToken, 'commands:execute');

    const output = executeSlashCommand(command);
    const message = await this.createBotMessage(bot.workspaceId, channelId, bot.createdById, output);

    await this.prisma.botEvent.create({
      data: {
        workspaceId: bot.workspaceId,
        botId: bot.id,
        type: 'SLASH_COMMAND',
        payload: {
          command,
          output,
          channelId,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      command,
      output,
      message,
    };
  }

  async sendMessage(botId: string, channelId: string, content: string, botToken: string) {
    const bot = await this.authenticateBot(botId, botToken, 'messages:write');
    const message = await this.createBotMessage(bot.workspaceId, channelId, bot.createdById, content);

    return {
      sent: true,
      message,
    };
  }

  private async createBotMessage(
    workspaceId: string,
    channelId: string,
    authorId: string,
    content: string,
  ) {
    await this.ensureChannelInWorkspace(channelId, workspaceId);
    const created = await this.createBotMessageWithRetry({
      workspaceId,
      channelId,
      authorId,
      content,
    });

    return {
      ...created,
      sequence: Number(created.sequence),
    };
  }

  private async authenticateBot(botId: string, botToken: string, requiredScope: string) {
    const bot = await this.ensureBot(botId);

    if (this.hash(botToken) !== bot.tokenHash) {
      throw new ForbiddenException('Invalid bot token');
    }

    if (!bot.scopes.includes(requiredScope)) {
      throw new ForbiddenException(`Bot does not have required scope: ${requiredScope}`);
    }

    return bot;
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
      throw new ForbiddenException('Only owner or admin can manage bots');
    }
  }

  private async ensureChannelInWorkspace(channelId: string, workspaceId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        workspaceId: true,
        isArchived: true,
      },
    });

    if (!channel || channel.workspaceId !== workspaceId || channel.isArchived) {
      throw new NotFoundException('Channel not found in workspace');
    }
  }

  private async ensureBot(botId: string) {
    const bot = await this.prisma.bot.findUnique({
      where: { id: botId },
    });

    if (!bot || !bot.isActive) {
      throw new NotFoundException('Bot not found or inactive');
    }

    return bot;
  }

  private hash(raw: string) {
    return createHash('sha256').update(raw).digest('hex');
  }

  private async createBotMessageWithRetry(
    input: {
      workspaceId: string;
      channelId: string;
      authorId: string;
      content: string;
    },
    maxAttempts = 5,
  ) {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const sequence = await this.nextSequence(input.channelId);

      try {
        return await this.prisma.message.create({
          data: {
            ...input,
            type: 'BOT',
            sequence,
          },
        });
      } catch (error) {
        const isConflict =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

        if (!isConflict || attempt === maxAttempts) {
          throw error;
        }
      }
    }

    throw new InternalServerErrorException('Unable to allocate bot message sequence');
  }

  private async nextSequence(channelId: string) {
    const latest = await this.prisma.message.findFirst({
      where: { channelId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });

    return (latest?.sequence ?? BigInt(0)) + BigInt(1);
  }
}
