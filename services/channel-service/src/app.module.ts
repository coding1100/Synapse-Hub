import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { ChannelsModule } from './channels/channels.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ChannelsModule],
  controllers: [HealthController],
})
export class AppModule {}
