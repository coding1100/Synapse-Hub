import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

export type RealtimeEventEnvelope = {
  room: string;
  event: string;
  payload: unknown;
};

@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private readonly eventEmitter = new EventEmitter();
  private readonly channel = 'synapsehub:events';

  private publisher!: Redis;
  private subscriber!: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';

    this.publisher = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    this.subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    await this.subscriber.subscribe(this.channel);
    this.subscriber.on('message', (channel, message) => {
      if (channel !== this.channel) {
        return;
      }

      try {
        const payload = JSON.parse(message) as RealtimeEventEnvelope;
        this.eventEmitter.emit('event', payload);
      } catch (error) {
        this.logger.error('Failed to parse realtime event', error as Error);
      }
    });
  }

  async onModuleDestroy() {
    await Promise.all([this.publisher?.quit(), this.subscriber?.quit()]);
  }

  async publish(event: RealtimeEventEnvelope) {
    await this.publisher.publish(this.channel, JSON.stringify(event));
  }

  onEvent(listener: (event: RealtimeEventEnvelope) => void) {
    this.eventEmitter.on('event', listener);
    return () => this.eventEmitter.off('event', listener);
  }
}