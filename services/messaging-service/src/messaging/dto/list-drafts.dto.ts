import { IsString, IsOptional } from 'class-validator';

export class ListDraftsDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  @IsOptional()
  channelId?: string;
}
