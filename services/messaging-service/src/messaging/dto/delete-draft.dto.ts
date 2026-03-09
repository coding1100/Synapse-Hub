import { IsOptional, IsString } from 'class-validator';

export class DeleteDraftDto {
  @IsString()
  channelId!: string;

  @IsString()
  @IsOptional()
  threadId?: string;
}
