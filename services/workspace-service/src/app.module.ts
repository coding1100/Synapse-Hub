import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { BotsModule } from './bots/bots.module';
import { IntegrationsModule } from './integrations/integrations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WorkspacesModule,
    BotsModule,
    IntegrationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}