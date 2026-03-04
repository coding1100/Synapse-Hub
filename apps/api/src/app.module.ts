import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), RealtimeModule],
  controllers: [HealthController],
})
export class AppModule {}