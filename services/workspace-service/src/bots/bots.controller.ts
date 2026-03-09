import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { BotsService } from './bots.service';
import { CreateBotDto } from './dto/create-bot.dto';
import { ListBotsDto } from './dto/list-bots.dto';
import { BotEventDto } from './dto/bot-event.dto';
import { SlashCommandDto } from './dto/slash-command.dto';
import { BotMessageDto } from './dto/bot-message.dto';

@Controller('bots')
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Post()
  create(@Body() dto: CreateBotDto, @Headers('x-user-id') userId?: string) {
    return this.botsService.create({
      ...dto,
      createdById: this.requireUserId(userId),
    });
  }

  @Get()
  list(@Query() query: ListBotsDto, @Headers('x-user-id') userId?: string) {
    return this.botsService.list(query.workspaceId, this.requireUserId(userId));
  }

  @Post(':id/events')
  emitEvent(
    @Param('id') botId: string,
    @Body() dto: BotEventDto,
    @Headers('x-bot-token') botToken?: string,
  ) {
    return this.botsService.recordEvent(botId, dto, this.requireBotToken(botToken));
  }

  @Post(':id/commands')
  command(
    @Param('id') botId: string,
    @Body() dto: SlashCommandDto,
    @Headers('x-bot-token') botToken?: string,
  ) {
    return this.botsService.runSlashCommand(
      botId,
      dto.channelId,
      dto.command,
      this.requireBotToken(botToken),
    );
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') botId: string,
    @Body() dto: BotMessageDto,
    @Headers('x-bot-token') botToken?: string,
  ) {
    return this.botsService.sendMessage(
      botId,
      dto.channelId,
      dto.content,
      this.requireBotToken(botToken),
    );
  }

  private requireUserId(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    return userId;
  }

  private requireBotToken(botToken?: string) {
    if (!botToken) {
      throw new UnauthorizedException('Missing x-bot-token header');
    }

    return botToken;
  }
}
