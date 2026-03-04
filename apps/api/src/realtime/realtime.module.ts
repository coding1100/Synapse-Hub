import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RealtimeGateway } from './realtime.gateway';
import { MessagingClientService } from './messaging-client.service';
import { RedisPubSubService } from './redis-pubsub.service';

@Module({
  imports: [HttpModule],
  providers: [RealtimeGateway, MessagingClientService, RedisPubSubService],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}