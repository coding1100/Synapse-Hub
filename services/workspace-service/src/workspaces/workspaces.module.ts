import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { EmailDeliveryService } from './email-delivery.service';
import { WorkspacesService } from './workspaces.service';

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService, EmailDeliveryService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
