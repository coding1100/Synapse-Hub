import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { EmitNotificationDto } from './dto/emit-notification.dto';
import { ListNotificationsDto } from './dto/list-notifications.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('emit')
  emit(@Body() dto: EmitNotificationDto) {
    return this.notificationsService.emit(dto);
  }

  @Get(':userId')
  list(
    @Param('userId') userId: string,
    @Query() query: Omit<ListNotificationsDto, 'userId'>,
    @Headers('x-user-id') requesterId?: string,
  ) {
    const currentUserId = this.requireUserId(requesterId);
    if (currentUserId !== userId) {
      throw new ForbiddenException('Cannot access notifications of another user');
    }

    return this.notificationsService.list(userId, query.cursor, Number(query.limit ?? '20'));
  }

  @Patch(':id/read')
  markRead(@Param('id') notificationId: string, @Headers('x-user-id') requesterId?: string) {
    return this.notificationsService.markRead(notificationId, this.requireUserId(requesterId));
  }

  private requireUserId(userId?: string) {
    if (!userId) {
      throw new UnauthorizedException('Missing x-user-id header');
    }

    return userId;
  }
}
