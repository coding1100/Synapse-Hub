import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), RealtimeModule],
  controllers: [HealthController, MetricsController],
})
export class AppModule {}