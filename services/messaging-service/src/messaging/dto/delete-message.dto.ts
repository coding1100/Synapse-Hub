import { IsOptional, IsString } from 'class-validator';

export class DeleteMessageDto {
  @IsString()
  @IsOptional()
  deletedByUserId?: string;
}
