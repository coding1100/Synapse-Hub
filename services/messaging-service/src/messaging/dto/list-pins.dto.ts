import { IsString } from 'class-validator';

export class ListPinsDto {
  @IsString()
  channelId!: string;
}
