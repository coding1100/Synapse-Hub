import { IsIn, IsOptional, IsString } from 'class-validator';

export class IndexDocumentDto {
  @IsIn(['message', 'channel', 'user', 'file'])
  type!: 'message' | 'channel' | 'user' | 'file';

  @IsString()
  id!: string;

  @IsString()
  workspaceId!: string;

  @IsString()
  content!: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
