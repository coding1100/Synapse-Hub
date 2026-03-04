import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), MessagingModule],
  controllers: [HealthController],
})
export class AppModule {}
