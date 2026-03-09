import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { DeleteDraftDto } from './dto/delete-draft.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { ListBookmarksDto } from './dto/list-bookmarks.dto';
import { ListDraftsDto } from './dto/list-drafts.dto';
import { ListMessagesDto } from './dto/list-messages.dto';
import { ListPinsDto } from './dto/list-pins.dto';
import { ListScheduledMessagesDto } from './dto/list-scheduled-messages.dto';
import { ReactMessageDto } from './dto/react-message.dto';
import { ReplyThreadDto } from './dto/reply-thread.dto';
import { ScheduleMessageDto } from './dto/schedule-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { TypingIndicatorDto } from './dto/typing-indicator.dto';
import { UpsertDraftDto } from './dto/upsert-draft.dto';
import { MessagingService } from './messaging.service';

@Controller()
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('messages')
  send(@Body() dto: SendMessageDto, @Headers('x-user-id') userId?: string) {
    return this.messagingService.sendMessage(dto, this.requireUserId(userId));
  }

  @Get('messages')
  list(@Query() query: ListMessagesDto, @Headers('x-user-id') userId?: string) {
    return this.messagingService.listMessages(
      query.channelId,
      this.requireUserId(userId),
      query.cursor,
      Number(query.limit ?? '50'),
    );
  }

  @Patch('messages/:id')
  edit(@Param('id') messageId: string, @Body() dto: EditMessageDto, @Headers('x-user-id') userId?: string) {
    return this.messagingService.editMessage(messageId, dto.content, this.requireUserId(userId));
  }

  @Delete('messages/:id')
  delete(@Param('id') messageId: string, @Headers('x-user-id') userId?: string) {
    return this.messagingService.deleteMessage(messageId, this.requireUserId(userId));
  }

  @Post('messages/:id/reactions')
  react(@Param('id') messageId: string, @Body() dto: ReactMessageDto, @Headers('x-user-id') userId?: string) {
    return this.messagingService.reactToMessage(
      messageId,
      this.requireUserId(userId),
      dto.emoji,
    );
  }

  @Post('messages/:id/pin')
  pinMessage(@Param('id') messageId: string, @Headers('x-user-id') userId?: string) {
    return this.messagingService.pinMessage(messageId, this.requireUserId(userId));
  }

  @Delete('messages/:id/pin')
  unpinMessage(@Param('id') messageId: string, @Headers('x-user-id') userId?: string) {
    return this.messagingService.unpinMessage(messageId, this.requireUserId(userId));
  }

  @Get('messages/pins')
  listPins(@Query() query: ListPinsDto, @Headers('x-user-id') userId?: string) {
    return this.messagingService.listPins(query.channelId, this.requireUserId(userId));
  }

  @Post('messages/typing')
  typing(@Body() dto: TypingIndicatorDto, @Headers('x-user-id') userId?: string) {
    return this.messagingService.typing(dto.channelId, this.requireUserId(userId));
  }

  @Post('threads')
  createThread(@Body() dto: CreateThreadDto, @Headers('x-user-id') userId?: string) {
    return this.messagingService.createThread(
      dto.rootMessageId,
      dto.channelId,
      this.requireUserId(userId),
    );
  }

  @Post('threads/:id/replies')
  reply(@Param('id') threadId: string, @Body() dto: ReplyThreadDto, @Headers('x-user-id') userId?: string) {
    return this.messagingService.replyInThread(threadId, this.requireUserId(userId), dto.content);
  }

  @Get('threads/:id')
  getThread(@Param('id') threadId: string, @Headers('x-user-id') userId?: string) {
    return this.messagingService.getThread(threadId, this.requireUserId(userId));
  }

  @Post('bookmarks')
  createBookmark(@Body() dto: CreateBookmarkDto, @Headers('x-user-id') userId?: string) {
    return this.messagingService.createBookmark(dto.messageId, this.requireUserId(userId));
  }

  @Get('bookmarks')
  listBookmarks(@Query() query: ListBookmarksDto, @Headers('x-user-id') userId?: string) {
    return this.messagingService.listBookmarks(
      query.workspaceId,
      this.requireUserId(userId),
      query.channelId,
      query.cursor,
      Number(query.limit ?? '50'),
    );
  }

  @Delete('bookmarks/:id')
  deleteBookmark(@Param('id') bookmarkId: string, @Headers('x-user-id') userId?: string) {
    return this.messagingService.deleteBookmark(bookmarkId, this.requireUserId(userId));
  }

  @Put('drafts')
  upsertDraft(@Body() dto: UpsertDraftDto, @Headers('x-user-id') userId?: string) {
    return this.messagingService.upsertDraft(this.requireUserId(userId), dto.channelId, dto.content, dto.threadId);
  }

  @Get('drafts')
  listDrafts(@Query() query: ListDraftsDto, @Headers('x-user-id') userId?: string) {
    return this.messagingService.listDrafts(this.requireUserId(userId), query.workspaceId, query.channelId);
  }

  @Delete('drafts')
  deleteDraft(@Query() query: DeleteDraftDto, @Headers('x-user-id') userId?: string) {
    return this.messagingService.deleteDraft(this.requireUserId(userId), query.channelId, query.threadId);
  }

  @Post('scheduled-messages')
  scheduleMessage(@Body() dto: ScheduleMessageDto, @Headers('x-user-id') userId?: string) {
    return this.messagingService.scheduleMessage(
      this.requireUserId(userId),
      dto.channelId,
      dto.content,
      dto.sendAt,
      dto.threadId,
    );
  }

  @Get('scheduled-messages')
  listScheduledMessages(@Query() query: ListScheduledMessagesDto, @Headers('x-user-id') userId?: string) {
    return this.messagingService.listScheduledMessages(
      this.requireUserId(userId),
      query.workspaceId,
      query.channelId,
      query.status,
      query.cursor,
      Number(query.limit ?? '50'),
    );
  }

  @Post('scheduled-messages/:id/cancel')
  cancelScheduledMessage(@Param('id') scheduledMessageId: string, @Headers('x-user-id') userId?: string) {
    return this.messagingService.cancelScheduledMessage(scheduledMessageId, this.requireUserId(userId));
  }

  private requireUserId(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    return userId;
  }
}
