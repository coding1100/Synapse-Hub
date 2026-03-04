import { IsString, MaxLength } from 'class-validator';

export class BotMessageDto {
  @IsString()
  channelId!: string;

  @IsString()
  @MaxLength(4000)
  content!: string;
}