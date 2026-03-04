import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly prisma = new PrismaClient();

  constructor(private readonly jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      throw new UnauthorizedException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: dto.displayName ?? email.split('@')[0],
      },
    });

    return this.issueTokens(user.id, user.email, user.displayName);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user.id, user.email, user.displayName);
  }

  async refresh(refreshToken: string) {
    const payload = this.jwtService.verify<{ sub: string; email: string; displayName: string }>(
      refreshToken,
      {
        secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
      },
    );

    const tokenHash = this.hashToken(refreshToken);
    const current = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!current || current.revokedAt || current.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(payload.sub, payload.email, payload.displayName);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: this.hashToken(refreshToken),
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { success: true };
  }

  oauthStart(provider: 'google' | 'github') {
    return {
      provider,
      authUrl: `${process.env.PUBLIC_BASE_URL ?? 'http://localhost:4000'}/auth/oauth/${provider}/callback`,
      message: 'Wire provider-specific OAuth app credentials for production.',
    };
  }

  async oauthCallback(provider: 'google' | 'github') {
    const providerAccountId = `dev-${Date.now()}`;
    const email = `${provider}.user.${Date.now()}@synapsehub.local`;

    const user = await this.prisma.user.upsert({
      where: { email },
      create: {
        email,
        displayName: `${provider}-user`,
      },
      update: {
        displayName: `${provider}-user`,
      },
    });

    await this.prisma.oAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      create: {
        userId: user.id,
        provider,
        providerAccountId,
      },
      update: {
        userId: user.id,
      },
    });

    return this.issueTokens(user.id, user.email, user.displayName);
  }

  private async issueTokens(userId: string, email: string, displayName: string) {
    const payload = { sub: userId, email, displayName };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
      expiresIn: '30d',
    });

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

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

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}