import { IsString } from 'class-validator';

export class TypingIndicatorDto {
  @IsString()
  channelId!: string;

  @IsString()
  userId!: string;
}
