import { IsString } from 'class-validator';

export class CreateBookmarkDto {
  @IsString()
  messageId!: string;
}
