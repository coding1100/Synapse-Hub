import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), MessagingModule],
  controllers: [HealthController, MetricsController],
})
export class AppModule {}
