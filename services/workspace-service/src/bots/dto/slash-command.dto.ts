import { IsString } from 'class-validator';

export class SlashCommandDto {
  @IsString()
  channelId!: string;

  @IsString()
  command!: string;
}