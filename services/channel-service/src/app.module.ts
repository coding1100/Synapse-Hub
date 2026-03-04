import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { ChannelsModule } from './channels/channels.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ChannelsModule],
  controllers: [HealthController, MetricsController],
})
export class AppModule {}
