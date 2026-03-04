import { IsOptional, IsString } from 'class-validator';

export class SearchUsersDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  cursor?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
