import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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
  create(@Body() dto: CreateBotDto) {
    return this.botsService.create(dto);
  }

  @Get()
  list(@Query() query: ListBotsDto) {
    return this.botsService.list(query.workspaceId);
  }

  @Post(':id/events')
  emitEvent(@Param('id') botId: string, @Body() dto: BotEventDto) {
    return this.botsService.recordEvent(botId, dto);
  }

  @Post(':id/commands')
  command(@Param('id') botId: string, @Body() dto: SlashCommandDto) {
    return this.botsService.runSlashCommand(botId, dto.channelId, dto.command);
  }

  @Post(':id/messages')
  sendMessage(@Param('id') botId: string, @Body() dto: BotMessageDto) {
    return this.botsService.sendMessage(botId, dto.channelId, dto.content);
  }
}