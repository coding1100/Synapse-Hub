import { IsString, MaxLength } from 'class-validator';

export class ReplyThreadDto {
  @IsString()
  userId!: string;

  @IsString()
  @MaxLength(4000)
  content!: string;
}
