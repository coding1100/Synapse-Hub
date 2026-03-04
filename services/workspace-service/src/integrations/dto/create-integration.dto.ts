import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateIntegrationDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  createdById!: string;

  @IsIn(['GITHUB', 'WEBHOOK', 'CUSTOM'])
  type!: 'GITHUB' | 'WEBHOOK' | 'CUSTOM';

  @IsString()
  @MaxLength(60)
  name!: string;

  @IsObject()
  config!: Record<string, unknown>;

  @IsString()
  @IsOptional()
  secret?: string;
}