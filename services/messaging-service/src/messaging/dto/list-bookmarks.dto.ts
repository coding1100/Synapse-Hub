import { IsOptional, IsString } from 'class-validator';

export class ListBookmarksDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  @IsOptional()
  channelId?: string;

  @IsString()
  @IsOptional()
  cursor?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
