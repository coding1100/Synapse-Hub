import { IsString } from 'class-validator';

export class CreateThreadDto {
  @IsString()
  rootMessageId!: string;

  @IsString()
  channelId!: string;
}
