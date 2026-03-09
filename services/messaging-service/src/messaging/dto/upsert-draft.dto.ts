import { IsString, MaxLength, IsOptional } from 'class-validator';

export class UpsertDraftDto {
  @IsString()
  channelId!: string;

  @IsString()
  @MaxLength(4000)
  content!: string;

  @IsString()
  @IsOptional()
  threadId?: string;
}
