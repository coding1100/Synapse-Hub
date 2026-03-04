import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

type AuthUser = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: Date;
};

@Injectable()
export class AuthService {
  private readonly usersByEmail = new Map<string, AuthUser>();
  private readonly refreshTokens = new Set<string>();

  constructor(private readonly jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    if (this.usersByEmail.has(dto.email.toLowerCase())) {
      throw new UnauthorizedException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user: AuthUser = {
      id: uuidv4(),
      email: dto.email.toLowerCase(),
      passwordHash,
      displayName: dto.displayName ?? dto.email.split('@')[0],
      createdAt: new Date(),
    };

    this.usersByEmail.set(user.email, user);
    return this.issueTokens(user.id, user.email, user.displayName);
  }

  async login(dto: LoginDto) {
    const user = this.usersByEmail.get(dto.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id, user.email, user.displayName);
  }

  refresh(refreshToken: string) {
    if (!this.refreshTokens.has(refreshToken)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = this.jwtService.verify<{ sub: string; email: string; displayName: string }>(
      refreshToken,
      {
        secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
      },
    );

    this.refreshTokens.delete(refreshToken);
    return this.issueTokens(payload.sub, payload.email, payload.displayName);
  }

  logout(refreshToken: string) {
    this.refreshTokens.delete(refreshToken);
    return { success: true };
  }

  oauthStart(provider: 'google' | 'github') {
    return {
      provider,
      authUrl: `${process.env.PUBLIC_BASE_URL ?? 'http://localhost:4000'}/auth/oauth/${provider}/callback`,
      message: 'Wire provider-specific OAuth app credentials for production.',
    };
  }

  oauthCallback(provider: 'google' | 'github') {
    const email = `${provider}.user.${Date.now()}@synapsehub.local`;
    const existing = this.usersByEmail.get(email);
    if (existing) {
      return this.issueTokens(existing.id, existing.email, existing.displayName);
    }

    const newUser: AuthUser = {
      id: uuidv4(),
      email,
      passwordHash: '',
      displayName: `${provider}-user`,
      createdAt: new Date(),
    };
    this.usersByEmail.set(email, newUser);
    return this.issueTokens(newUser.id, newUser.email, newUser.displayName);
  }

  private issueTokens(userId: string, email: string, displayName: string) {
    const payload = { sub: userId, email, displayName };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
      expiresIn: '30d',
    });

    this.refreshTokens.add(refreshToken);

    return {
      user: {
        id: userId,
        email,
        displayName,
      },
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }
}
