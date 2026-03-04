import { IsOptional, IsString } from 'class-validator';

export class ListMessagesDto {
  @IsString()
  channelId!: string;

  @IsString()
  @IsOptional()
  cursor?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
