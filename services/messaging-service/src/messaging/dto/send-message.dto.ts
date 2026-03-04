import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  channelId!: string;

  @IsString()
  userId!: string;

  @IsString()
  @MaxLength(4000)
  content!: string;

  @IsArray()
  @IsOptional()
  fileIds?: string[];

  @IsString()
  @IsOptional()
  threadId?: string;
}
