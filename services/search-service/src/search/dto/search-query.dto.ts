import { IsIn, IsOptional, IsString } from 'class-validator';

export class SearchQueryDto {
  @IsString()
  q!: string;

  @IsString()
  workspaceId!: string;

  @IsIn(['message', 'channel', 'user', 'file'])
  @IsOptional()
  type?: 'message' | 'channel' | 'user' | 'file';

  @IsString()
  @IsOptional()
  cursor?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
