import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MessagingClientService {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    configService: ConfigService,
  ) {
    this.baseUrl = configService.get<string>('MESSAGING_SERVICE_URL') ?? 'http://localhost:4005';
  }

  async sendMessage(userId: string, payload: { channelId: string; content: string; fileIds?: string[]; threadId?: string }) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/messages`, payload, {
        headers: {
          'x-user-id': userId,
        },
      }),
    );

    return response.data;
  }

  async assertChannelAccess(channelId: string, userId: string) {
    await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/messages`, {
        headers: {
          'x-user-id': userId,
        },
        params: {
          channelId,
          limit: 1,
        },
      }),
    );
  }

  async editMessage(messageId: string, userId: string, payload: { content: string }) {
    const response = await firstValueFrom(
      this.httpService.patch(`${this.baseUrl}/messages/${messageId}`, payload, {
        headers: {
          'x-user-id': userId,
        },
      }),
    );

    return response.data;
  }

  async deleteMessage(messageId: string, userId: string) {
    const response = await firstValueFrom(
      this.httpService.delete(`${this.baseUrl}/messages/${messageId}`, {
        headers: {
          'x-user-id': userId,
        },
      }),
    );

    return response.data;
  }

  async reactToMessage(messageId: string, userId: string, payload: { emoji: string }) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/messages/${messageId}/reactions`, payload, {
        headers: {
          'x-user-id': userId,
        },
      }),
    );

    return response.data;
  }

  async createThread(userId: string, payload: { rootMessageId: string; channelId: string }) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/threads`, payload, {
        headers: {
          'x-user-id': userId,
        },
      }),
    );

    return response.data;
  }

  async replyToThread(threadId: string, userId: string, payload: { content: string }) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/threads/${threadId}/replies`, payload, {
        headers: {
          'x-user-id': userId,
        },
      }),
    );

    return response.data;
  }
}
