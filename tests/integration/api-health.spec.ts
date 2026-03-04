import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../apps/api/src/app.module';
import { RedisPubSubService } from '../../apps/api/src/realtime/redis-pubsub.service';
import { MessagingClientService } from '../../apps/api/src/realtime/messaging-client.service';

describe('API Gateway Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisPubSubService)
      .useValue({
        onEvent: () => () => undefined,
        publish: jest.fn(),
      })
      .overrideProvider(MessagingClientService)
      .useValue({
        sendMessage: jest.fn(),
        editMessage: jest.fn(),
        deleteMessage: jest.fn(),
        reactToMessage: jest.fn(),
        createThread: jest.fn(),
        replyToThread: jest.fn(),
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns health status', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('api-gateway');
  });

  it('returns metrics endpoint', async () => {
    await request(app.getHttpServer()).get('/metrics').expect(200);
  });
});