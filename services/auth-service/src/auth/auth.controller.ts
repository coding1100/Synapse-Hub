import { Controller, Get, Param, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('oauth/:provider')
  oauthStart(@Param('provider') provider: string) {
    if (provider !== 'google' && provider !== 'github') {
      throw new UnauthorizedException('Unsupported OAuth provider');
    }
    return this.authService.oauthStart(provider);
  }

  @Get('oauth/:provider/callback')
  oauthCallback(@Param('provider') provider: string) {
    if (provider !== 'google' && provider !== 'github') {
      throw new UnauthorizedException('Unsupported OAuth provider');
    }
    return this.authService.oauthCallback(provider);
  }
}
