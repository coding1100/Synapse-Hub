import { IsEmail, IsIn, IsOptional } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsIn(['OWNER', 'ADMIN', 'MEMBER', 'GUEST'])
  @IsOptional()
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
}
