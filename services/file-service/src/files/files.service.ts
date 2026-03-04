import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { UploadFileDto } from './dto/upload-file.dto';

type FileRecord = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  uploaderUserId: string;
  messageId?: string;
  bucket: string;
  objectKey: string;
  url: string;
  createdAt: Date;
  deletedAt?: Date;
};

@Injectable()
export class FilesService {
  private readonly files = new Map<string, FileRecord>();

  upload(dto: UploadFileDto) {
    const bucket = process.env.S3_BUCKET ?? 'synapsehub-files';
    const id = uuidv4();
    const objectKey = `${dto.uploaderUserId}/${id}/${dto.filename}`;
    const endpoint = process.env.S3_ENDPOINT ?? 'http://localhost:9000';

    const file: FileRecord = {
      id,
      filename: dto.filename,
      mimeType: dto.mimeType,
      size: dto.size,
      uploaderUserId: dto.uploaderUserId,
      messageId: dto.messageId,
      bucket,
      objectKey,
      url: `${endpoint}/${bucket}/${objectKey}`,
      createdAt: new Date(),
    };

    this.files.set(file.id, file);
    return file;
  }

  get(fileId: string) {
    const file = this.files.get(fileId);
    if (!file || file.deletedAt) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  remove(fileId: string) {
    const file = this.files.get(fileId);
    if (!file || file.deletedAt) {
      throw new NotFoundException('File not found');
    }

    file.deletedAt = new Date();
    this.files.set(file.id, file);
    return {
      id: file.id,
      deleted: true,
      deletedAt: file.deletedAt,
    };
  }
}
