import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { verify } from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';

const proxyTable = [
  { route: '/auth', env: 'AUTH_SERVICE_URL', defaultUrl: 'http://localhost:4001' },
  { route: '/users', env: 'USER_SERVICE_URL', defaultUrl: 'http://localhost:4002' },
  { route: '/workspaces', env: 'WORKSPACE_SERVICE_URL', defaultUrl: 'http://localhost:4003' },
  { route: '/bots', env: 'WORKSPACE_SERVICE_URL', defaultUrl: 'http://localhost:4003' },
  { route: '/integrations', env: 'WORKSPACE_SERVICE_URL', defaultUrl: 'http://localhost:4003' },
  { route: '/channels', env: 'CHANNEL_SERVICE_URL', defaultUrl: 'http://localhost:4004' },
  { route: '/messages', env: 'MESSAGING_SERVICE_URL', defaultUrl: 'http://localhost:4005' },
  { route: '/threads', env: 'MESSAGING_SERVICE_URL', defaultUrl: 'http://localhost:4005' },
  { route: '/bookmarks', env: 'MESSAGING_SERVICE_URL', defaultUrl: 'http://localhost:4005' },
  { route: '/drafts', env: 'MESSAGING_SERVICE_URL', defaultUrl: 'http://localhost:4005' },
  { route: '/scheduled-messages', env: 'MESSAGING_SERVICE_URL', defaultUrl: 'http://localhost:4005' },
  { route: '/notifications', env: 'NOTIFICATION_SERVICE_URL', defaultUrl: 'http://localhost:4006' },
  { route: '/files', env: 'FILE_SERVICE_URL', defaultUrl: 'http://localhost:4007' },
  { route: '/search', env: 'SEARCH_SERVICE_URL', defaultUrl: 'http://localhost:4008' },
];

const publicRoutePatterns = [
  /^\/health$/,
  /^\/metrics$/,
  /^\/socket\.io\//,
  /^\/auth\/register$/,
  /^\/auth\/login$/,
  /^\/auth\/refresh$/,
  /^\/auth\/logout$/,
  /^\/auth\/forgot-password$/,
  /^\/auth\/reset-password$/,
  /^\/auth\/verify-email$/,
  /^\/auth\/resend-verification$/,
  /^\/integrations\/[^/]+\/events\/(webhook|custom)$/,
  /^\/bots\/[^/]+\/(events|commands|messages)$/,
];

function isPublicRoute(path: string) {
  return publicRoutePatterns.some((pattern) => pattern.test(path));
}

function getBearerToken(authorization?: string) {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return undefined;
  }

  const token = authorization.slice(7).trim();
  return token.length > 0 ? token : undefined;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const corsOrigins = (config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  const configuredLimit = Number(config.get('RATE_LIMIT_PER_MINUTE') ?? '300');
  const rateLimitPerMinute = Number.isFinite(configuredLimit) ? configuredLimit : 300;

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: Math.max(50, rateLimitPerMinute),
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const express = app.getHttpAdapter().getInstance();

  express.use((req: any, res: any, next: () => void) => {
    delete req.headers['x-user-id'];

    if (isPublicRoute(req.path)) {
      next();
      return;
    }

    const token = getBearerToken(
      typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
    );

    if (!token) {
      res.status(401).json({ message: 'Missing bearer token' });
      return;
    }

    try {
      const payload = verify(token, config.get<string>('JWT_ACCESS_SECRET') ?? 'change-me-access') as
        | string
        | { sub?: string };

      if (typeof payload === 'string' || !payload.sub) {
        throw new Error('Invalid token payload');
      }

      req.headers['x-user-id'] = payload.sub;
      next();
    } catch {
      res.status(401).json({ message: 'Invalid bearer token' });
    }
  });

  proxyTable.forEach(({ route, env, defaultUrl }) => {
    const target = config.get<string>(env) ?? defaultUrl;
    express.use(
      route,
      createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: (path) => {
          if (path.startsWith(route)) {
            return path;
          }
          return `${route}${path}`;
        },
      }),
    );
  });

  const port = Number(config.get('PORT') ?? 4000);
  await app.listen(port);
}

void bootstrap();

