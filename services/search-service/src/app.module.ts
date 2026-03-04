import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { SearchModule } from './search/search.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), SearchModule],
  controllers: [HealthController, MetricsController],
})
export class AppModule {}
