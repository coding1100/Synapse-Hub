import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UploadFileDto } from './dto/upload-file.dto';

@Injectable()
export class FilesService {
  private readonly prisma = new PrismaClient();

  async upload(dto: UploadFileDto) {
    const bucket = process.env.S3_BUCKET ?? 'synapsehub-files';
    const endpoint = process.env.S3_ENDPOINT ?? 'http://localhost:9000';
    const objectKey = `${dto.uploaderUserId}/${Date.now()}-${dto.filename}`;

    await this.prisma.user.upsert({
      where: { id: dto.uploaderUserId },
      create: {
        id: dto.uploaderUserId,
        email: `${dto.uploaderUserId}@synapsehub.local`,
        displayName: `user-${dto.uploaderUserId.slice(0, 6)}`,
      },
      update: {},
    });

    return this.prisma.file.create({
      data: {
        workspaceId: dto.workspaceId,
        uploaderId: dto.uploaderUserId,
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

  async get(fileId: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.deletedAt) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  async remove(fileId: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.deletedAt) {
      throw new NotFoundException('File not found');
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
}