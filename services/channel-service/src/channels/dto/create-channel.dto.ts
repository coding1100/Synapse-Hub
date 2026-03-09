import { IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  memberIds?: string[];
}
