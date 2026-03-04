import { IsOptional, IsString } from 'class-validator';

export class ListWorkspacesDto {
  @IsString()
  @IsOptional()
  cursor?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
