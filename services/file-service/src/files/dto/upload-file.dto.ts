import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UploadFileDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  @MaxLength(255)
  filename!: string;

  @IsString()
  mimeType!: string;

  @IsInt()
  @Min(1)
  size!: number;
  @IsString()
  @IsOptional()
  channelId?: string;

  @IsString()
  @IsOptional()
  messageId?: string;
}
