import { IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class CreateInviteLinkDto {
  @IsIn(['OWNER', 'ADMIN', 'MEMBER', 'GUEST'])
  @IsOptional()
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

  @IsInt()
  @Min(1)
  @Max(24 * 30)
  @IsOptional()
  expiresInHours?: number;

  @IsInt()
  @Min(1)
  @Max(100000)
  @IsOptional()
  maxUses?: number;

  @IsString()
  @Matches(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
  @IsOptional()
  allowedDomain?: string;
}
