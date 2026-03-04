import { Injectable, NotFoundException } from '@nestjs/common';
import { DeliveryStatus, PrismaClient } from '@prisma/client';
import { EmitNotificationDto } from './dto/emit-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly prisma = new PrismaClient();

  async emit(dto: EmitNotificationDto) {
    await this.prisma.user.upsert({
      where: { id: dto.userId },
      create: {
        id: dto.userId,
        email: `${dto.userId}@synapsehub.local`,
        displayName: `user-${dto.userId.slice(0, 6)}`,
      },
      update: {},
    });

    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.type,
        body: dto.message,
        entityId: dto.entityId,
        entityType: 'message',
        deliveryStatus: DeliveryStatus.PENDING,
      },
    });

    await this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        deliveryStatus: DeliveryStatus.SENT,
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

  async markRead(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) {
      throw new NotFoundException('Notification not found');
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