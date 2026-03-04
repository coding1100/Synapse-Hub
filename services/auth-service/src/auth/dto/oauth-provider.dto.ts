import { IsIn } from 'class-validator';

export class OAuthProviderDto {
  @IsIn(['google', 'github'])
  provider!: 'google' | 'github';
}
