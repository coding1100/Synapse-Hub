import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EmitNotificationDto } from './dto/emit-notification.dto';

type Notification = {
  id: string;
  userId: string;
  type: 'MENTION' | 'DIRECT_MESSAGE' | 'THREAD_REPLY' | 'CHANNEL_ACTIVITY';
  message: string;
  entityId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class NotificationsService {
  private readonly notificationsById = new Map<string, Notification>();
  private readonly userNotificationIds = new Map<string, string[]>();

  emit(dto: EmitNotificationDto) {
    const notification: Notification = {
      id: uuidv4(),
      userId: dto.userId,
      type: dto.type,
      message: dto.message,
      entityId: dto.entityId,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.notificationsById.set(notification.id, notification);
    const ids = this.userNotificationIds.get(notification.userId) ?? [];
    ids.unshift(notification.id);
    this.userNotificationIds.set(notification.userId, ids);

    return {
      ...notification,
      delivery: {
        inApp: 'queued',
        email: 'queued',
      },
    };
  }

  list(userId: string, cursor?: string, limit = 20) {
    const normalizedLimit = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 20, 100));
    const ids = this.userNotificationIds.get(userId) ?? [];

    const startIdx = cursor ? Math.max(ids.findIndex((id) => id === cursor) + 1, 0) : 0;
    const pageIds = ids.slice(startIdx, startIdx + normalizedLimit);
    const data = pageIds
      .map((id) => this.notificationsById.get(id))
      .filter((n): n is Notification => !!n);

    return {
      data,
      paging: {
        cursor: data.length === normalizedLimit ? data[data.length - 1].id : null,
        limit: normalizedLimit,
      },
      unreadCount: ids
        .map((id) => this.notificationsById.get(id))
        .filter((n): n is Notification => !!n && !n.isRead).length,
    };
  }

  markRead(notificationId: string) {
    const notification = this.notificationsById.get(notificationId);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.updatedAt = new Date();
    this.notificationsById.set(notification.id, notification);

    return notification;
  }
}
