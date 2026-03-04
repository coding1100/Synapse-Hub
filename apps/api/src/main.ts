import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware } from 'http-proxy-middleware';
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
  { route: '/notifications', env: 'NOTIFICATION_SERVICE_URL', defaultUrl: 'http://localhost:4006' },
  { route: '/files', env: 'FILE_SERVICE_URL', defaultUrl: 'http://localhost:4007' },
  { route: '/search', env: 'SEARCH_SERVICE_URL', defaultUrl: 'http://localhost:4008' },
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = app.get(ConfigService);
  const express = app.getHttpAdapter().getInstance();

  proxyTable.forEach(({ route, env, defaultUrl }) => {
    const target = config.get<string>(env) ?? defaultUrl;
    express.use(
      route,
      createProxyMiddleware({
        target,
        changeOrigin: true,
        ws: true,
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
