import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { FilesModule } from './files/files.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), FilesModule],
  controllers: [HealthController, MetricsController],
})
export class AppModule {}
