import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), WorkspacesModule],
  controllers: [HealthController],
})
export class AppModule {}
