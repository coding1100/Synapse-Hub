import { IsOptional, IsString } from 'class-validator';

export class ListChannelsDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  @IsOptional()
  cursor?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
