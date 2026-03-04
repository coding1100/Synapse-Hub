import { IsOptional, IsString } from 'class-validator';

export class MembershipDto {
  @IsString()
  @IsOptional()
  userId?: string;
}
