import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { CreateBotDto } from './dto/create-bot.dto';
import { BotEventDto } from './dto/bot-event.dto';
import { executeSlashCommand } from './command-runner';

@Injectable()
export class BotsService {
  private readonly prisma = new PrismaClient();

  async create(dto: CreateBotDto) {
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

  async list(workspaceId: string) {
    return this.prisma.bot.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordEvent(botId: string, dto: BotEventDto) {
    const bot = await this.ensureBot(botId);

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

  async runSlashCommand(botId: string, channelId: string, command: string) {
    const bot = await this.ensureBot(botId);

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

  async sendMessage(botId: string, channelId: string, content: string) {
    const bot = await this.ensureBot(botId);
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
    const latest = await this.prisma.message.findFirst({
      where: { channelId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });

    const created = await this.prisma.message.create({
      data: {
        workspaceId,
        channelId,
        authorId,
        type: 'BOT',
        content,
        sequence: (latest?.sequence ?? BigInt(0)) + BigInt(1),
      },
    });

    return {
      ...created,
      sequence: Number(created.sequence),
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
}
