import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { ReactMessageDto } from './dto/react-message.dto';
import { ListMessagesDto } from './dto/list-messages.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { ReplyThreadDto } from './dto/reply-thread.dto';
import { TypingIndicatorDto } from './dto/typing-indicator.dto';

@Controller()
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('messages')
  send(@Body() dto: SendMessageDto) {
    return this.messagingService.sendMessage(dto);
  }

  @Get('messages')
  list(@Query() query: ListMessagesDto) {
    return this.messagingService.listMessages(query.channelId, query.cursor, Number(query.limit ?? '50'));
  }

  @Patch('messages/:id')
  edit(@Param('id') messageId: string, @Body() dto: EditMessageDto) {
    return this.messagingService.editMessage(messageId, dto.content, dto.editorUserId);
  }

  @Delete('messages/:id')
  delete(@Param('id') messageId: string, @Body() dto: DeleteMessageDto) {
    return this.messagingService.deleteMessage(messageId, dto.deletedByUserId);
  }

  @Post('messages/:id/reactions')
  react(@Param('id') messageId: string, @Body() dto: ReactMessageDto) {
    return this.messagingService.reactToMessage(messageId, dto.userId, dto.emoji);
  }

  @Post('messages/typing')
  typing(@Body() dto: TypingIndicatorDto) {
    return this.messagingService.typing(dto.channelId, dto.userId);
  }

  @Post('threads')
  createThread(@Body() dto: CreateThreadDto) {
    return this.messagingService.createThread(dto.rootMessageId, dto.channelId);
  }

  @Post('threads/:id/replies')
  reply(@Param('id') threadId: string, @Body() dto: ReplyThreadDto) {
    return this.messagingService.replyInThread(threadId, dto.userId, dto.content);
  }

  @Get('threads/:id')
  getThread(@Param('id') threadId: string) {
    return this.messagingService.getThread(threadId);
  }
}
