import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
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
  list(@Param('userId') userId: string, @Query() query: Omit<ListNotificationsDto, 'userId'>) {
    return this.notificationsService.list(userId, query.cursor, Number(query.limit ?? '20'));
  }

  @Patch(':id/read')
  markRead(@Param('id') notificationId: string) {
    return this.notificationsService.markRead(notificationId);
  }
}
