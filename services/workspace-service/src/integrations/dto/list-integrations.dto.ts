import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListIntegrationsDto {
  @IsString()
  workspaceId!: string;

  @IsIn(['WEBHOOK', 'CUSTOM'])
  @IsOptional()
  type?: 'WEBHOOK' | 'CUSTOM';
}
