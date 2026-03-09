import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class ScheduleMessageDto {
  @IsString()
  channelId!: string;

  @IsString()
  @MaxLength(4000)
  content!: string;

  @IsISO8601()
  sendAt!: string;

  @IsString()
  @IsOptional()
  threadId?: string;
}
