import { IsString, MaxLength } from 'class-validator';

export class ReplyThreadDto {
  @IsString()
  @MaxLength(4000)
  content!: string;
}
