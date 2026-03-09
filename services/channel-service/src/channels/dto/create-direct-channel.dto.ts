import { IsString } from 'class-validator';

export class CreateDirectChannelDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  targetUserId!: string;
}
