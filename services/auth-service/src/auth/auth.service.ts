import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Prisma, PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailDeliveryService } from './email-delivery.service';

type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  emailVerifiedAt: Date | null;
};

@Injectable()
export class AuthService {
  private readonly prisma = new PrismaClient();
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly emailDelivery: EmailDeliveryService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const email = this.normalizeEmail(dto.email);
      const existing = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existing) {
        throw new ConflictException('Email already exists');
      }

      const passwordHash = await bcrypt.hash(dto.password, 12);
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          displayName: dto.displayName?.trim() || email.split('@')[0],
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          emailVerifiedAt: true,
        },
      });

      const session = await this.issueTokens(user);
      void this.sendVerificationEmail(user).catch((error) =>
        this.logger.warn(`Verification email dispatch failed for user=${user.id}: ${this.errorMessage(error)}`),
      );

      return session;
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: this.normalizeEmail(dto.email) },
        select: {
          id: true,
          email: true,
          displayName: true,
          emailVerifiedAt: true,
          passwordHash: true,
        },
      });

      if (!user || !user.passwordHash) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const valid = await bcrypt.compare(dto.password, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (this.requiresEmailVerification() && !user.emailVerifiedAt) {
        throw new UnauthorizedException('Email verification is required');
      }

      return this.issueTokens({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerifiedAt: user.emailVerifiedAt,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; displayName: string };

    try {
      payload = this.jwtService.verify<{ sub: string; email: string; displayName: string }>(
        refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
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

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          displayName: true,
          emailVerifiedAt: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.issueTokens(user);
    } catch (error) {
      this.handlePrismaError(error);
    }
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

  async forgotPassword(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        displayName: true,
        isActive: true,
      },
    });

    if (user && user.isActive) {
      const token = await this.createPasswordResetToken(user.id);
      void this.sendPasswordResetEmail(user, token).catch((error) =>
        this.logger.warn(`Password reset email dispatch failed for user=${user.id}: ${this.errorMessage(error)}`),
      );
    }

    return {
      success: true,
      message: 'If the account exists, a password reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.hashToken(token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        usedAt: true,
        expiresAt: true,
      },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash,
        },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: now },
      }),
      this.prisma.refreshToken.updateMany({
        where: {
          userId: resetToken.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      }),
    ]);

    return { success: true };
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hashToken(token);
    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        usedAt: true,
        expiresAt: true,
      },
    });

    if (!verificationToken || verificationToken.usedAt || verificationToken.expiresAt <= new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: {
          emailVerifiedAt: now,
        },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: now },
      }),
    ]);

    return { success: true };
  }

  async resendVerification(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        displayName: true,
        emailVerifiedAt: true,
      },
    });

    if (user && !user.emailVerifiedAt) {
      await this.prisma.emailVerificationToken.deleteMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
      });

      void this.sendVerificationEmail(user).catch((error) =>
        this.logger.warn(`Verification email resend failed for user=${user.id}: ${this.errorMessage(error)}`),
      );
    }

    return {
      success: true,
      message: 'If the account exists and is unverified, a verification email has been sent.',
    };
  }

  private async issueTokens(user: SessionUser) {
    const payload = {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
    };

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
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        emailVerifiedAt: user.emailVerifiedAt,
      },
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    };
  }

  private async sendVerificationEmail(user: { id: string; email: string; displayName: string }) {
    const token = await this.createEmailVerificationToken(user.id);
    const verifyUrl = `${this.publicWebUrl()}/verify-email?token=${encodeURIComponent(token)}`;

    await this.emailDelivery.send({
      to: user.email,
      subject: 'Verify your SynapseHub email',
      text: `Hi ${user.displayName}, verify your email by opening: ${verifyUrl}`,
      html: `<p>Hi ${this.escapeHtml(user.displayName)},</p><p>Verify your email by opening this link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
  }

  private async sendPasswordResetEmail(
    user: { id: string; email: string; displayName: string },
    token: string,
  ) {
    const resetUrl = `${this.publicWebUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    await this.emailDelivery.send({
      to: user.email,
      subject: 'Reset your SynapseHub password',
      text: `Hi ${user.displayName}, reset your password using: ${resetUrl}`,
      html: `<p>Hi ${this.escapeHtml(user.displayName)},</p><p>Reset your password using this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }

  private async createEmailVerificationToken(userId: string) {
    const rawToken = randomBytes(32).toString('hex');
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(rawToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    return rawToken;
  }

  private async createPasswordResetToken(userId: string) {
    const rawToken = randomBytes(32).toString('hex');

    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId,
        usedAt: null,
      },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(rawToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    return rawToken;
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private publicWebUrl() {
    const baseUrl = process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000';
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private requiresEmailVerification() {
    return (process.env.REQUIRE_EMAIL_VERIFICATION ?? 'false').trim().toLowerCase() === 'true';
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private errorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    return 'unknown error';
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      throw new ServiceUnavailableException(
        'Database schema is missing. Run Prisma migrations before starting auth-service.',
      );
    }

    throw error;
  }
}
