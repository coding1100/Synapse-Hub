import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EmitNotificationDto } from './dto/emit-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly prisma = new PrismaClient();

  async emit(dto: EmitNotificationDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.type,
        body: dto.message,
        entityId: dto.entityId,
        entityType: 'message',
        deliveryStatus: 'PENDING',
      },
    });

    await this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        deliveryStatus: 'SENT',
      },
    });

    return {
      ...notification,
      delivery: {
        inApp: 'sent',
        email: 'queued',
      },
    };
  }

  async list(userId: string, cursor?: string, limit = 20) {
    const normalizedLimit = Math.max(1, Math.min(Number.isFinite(limit) ? limit : 20, 100));

    const data = await this.prisma.notification.findMany({
      where: { userId },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: normalizedLimit,
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return {
      data,
      paging: {
        cursor: data.length === normalizedLimit ? data[data.length - 1].id : null,
        limit: normalizedLimit,
      },
      unreadCount,
    };
  }

  async markRead(notificationId: string, requesterId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== requesterId) {
      throw new ForbiddenException('Cannot mark another user notification as read');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }
}
