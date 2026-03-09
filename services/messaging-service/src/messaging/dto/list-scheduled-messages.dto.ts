import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListScheduledMessagesDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  @IsOptional()
  channelId?: string;

  @IsIn(['PENDING', 'PROCESSING', 'SENT', 'CANCELED', 'FAILED'])
  @IsOptional()
  status?: 'PENDING' | 'PROCESSING' | 'SENT' | 'CANCELED' | 'FAILED';

  @IsString()
  @IsOptional()
  cursor?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
