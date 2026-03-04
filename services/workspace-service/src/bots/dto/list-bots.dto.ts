import { IsString } from 'class-validator';

export class ListBotsDto {
  @IsString()
  workspaceId!: string;
}