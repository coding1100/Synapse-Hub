import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @MaxLength(255)
  filename!: string;

  @IsString()
  mimeType!: string;

  @IsInt()
  @Min(1)
  size!: number;

  @IsString()
  uploaderUserId!: string;

  @IsString()
  @IsOptional()
  messageId?: string;
}
