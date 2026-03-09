import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBotDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  @IsOptional()
  createdById?: string;

  @IsString()
  @MaxLength(60)
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  scopes?: string[];
}
