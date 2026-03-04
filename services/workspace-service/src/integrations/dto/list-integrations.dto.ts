import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListIntegrationsDto {
  @IsString()
  workspaceId!: string;

  @IsIn(['GITHUB', 'WEBHOOK', 'CUSTOM'])
  @IsOptional()
  type?: 'GITHUB' | 'WEBHOOK' | 'CUSTOM';
}