import { IsIn, IsOptional, IsString } from 'class-validator';

export class EmitNotificationDto {
  @IsString()
  userId!: string;

  @IsIn(['MENTION', 'DIRECT_MESSAGE', 'THREAD_REPLY', 'CHANNEL_ACTIVITY'])
  type!: 'MENTION' | 'DIRECT_MESSAGE' | 'THREAD_REPLY' | 'CHANNEL_ACTIVITY';

  @IsString()
  message!: string;

  @IsString()
  @IsOptional()
  entityId?: string;
}
