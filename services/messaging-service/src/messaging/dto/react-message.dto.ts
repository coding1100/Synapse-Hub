import { IsString } from 'class-validator';

export class ReactMessageDto {
  @IsString()
  userId!: string;

  @IsString()
  emoji!: string;
}
