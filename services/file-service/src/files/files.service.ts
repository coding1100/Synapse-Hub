import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient, WorkspaceRole } from '@prisma/client';
import { UploadFileDto } from './dto/upload-file.dto';

@Injectable()
export class FilesService {
  private readonly prisma = new PrismaClient();

  async upload(dto: UploadFileDto, uploaderUserId: string) {
    const bucket = process.env.S3_BUCKET ?? 'synapsehub-files';
    const endpoint = process.env.S3_ENDPOINT ?? 'http://localhost:9000';
    const objectKey = `${uploaderUserId}/${Date.now()}-${dto.filename}`;

    await this.ensureWorkspaceMember(dto.workspaceId, uploaderUserId);

    if (dto.channelId) {
      await this.ensureChannelAccess(dto.workspaceId, dto.channelId, uploaderUserId);
    }

    if (dto.messageId) {
      await this.ensureMessage(dto.workspaceId, dto.messageId, dto.channelId);
    }

    return this.prisma.file.create({
      data: {
        workspaceId: dto.workspaceId,
        uploaderId: uploaderUserId,
        channelId: dto.channelId,
        messageId: dto.messageId,
        filename: dto.filename,
        mimeType: dto.mimeType,
        size: dto.size,
        bucket,
        objectKey,
        url: `${endpoint}/${bucket}/${objectKey}`,
      },
    });
  }

  async get(fileId: string, requesterId: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.deletedAt) {
      throw new NotFoundException('File not found');
    }

    await this.ensureFileAccess(file.workspaceId, file.channelId, requesterId);

    return file;
  }

  async remove(fileId: string, requesterId: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.deletedAt) {
      throw new NotFoundException('File not found');
    }

    await this.ensureFileAccess(file.workspaceId, file.channelId, requesterId);

    const canDelete = await this.canDeleteFile(file.workspaceId, file.uploaderId, requesterId);
    if (!canDelete) {
      throw new ForbiddenException('Only uploader, admin, or owner can delete file');
    }

    const removed = await this.prisma.file.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });

    return {
      id: removed.id,
      deleted: true,
      deletedAt: removed.deletedAt,
    };
  }

  private async ensureFileAccess(workspaceId: string, channelId: string | null, userId: string) {
    await this.ensureWorkspaceMember(workspaceId, userId);

    if (channelId) {
      await this.ensureChannelAccess(workspaceId, channelId, userId);
    }
  }

  private async canDeleteFile(workspaceId: string, uploaderId: string, userId: string) {
    if (uploaderId === userId) {
      return true;
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: {
        role: true,
      },
    });

    return member?.role === WorkspaceRole.OWNER || member?.role === WorkspaceRole.ADMIN;
  }

  private async ensureWorkspaceMember(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: { userId: true },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of this workspace');
    }
  }

  private async ensureChannelAccess(workspaceId: string, channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: {
        id: true,
        workspaceId: true,
        type: true,
        isArchived: true,
      },
    });

    if (!channel || channel.workspaceId !== workspaceId || channel.isArchived) {
      throw new NotFoundException('Channel not found in workspace');
    }

    if (channel.type !== 'PUBLIC') {
      const channelMembership = await this.prisma.channelMember.findUnique({
        where: {
          channelId_userId: {
            channelId,
            userId,
          },
        },
        select: { userId: true },
      });

      if (!channelMembership) {
        throw new ForbiddenException('User is not a member of this channel');
      }
    }
  }

  private async ensureMessage(workspaceId: string, messageId: string, channelId?: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        workspaceId: true,
        channelId: true,
      },
    });

    if (!message || message.workspaceId !== workspaceId || (channelId && message.channelId !== channelId)) {
      throw new NotFoundException('Message not found in workspace/channel');
    }
  }
}
