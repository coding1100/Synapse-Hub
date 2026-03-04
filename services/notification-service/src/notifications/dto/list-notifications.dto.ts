import { IsOptional, IsString } from 'class-validator';

export class ListNotificationsDto {
  @IsString()
  userId!: string;

  @IsString()
  @IsOptional()
  cursor?: string;

  @IsString()
  @IsOptional()
  limit?: string;
}
