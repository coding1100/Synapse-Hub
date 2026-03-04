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
      this.httpService.post(`${this.baseUrl}/messages`, {
        ...payload,
        userId,
      }),
    );

    return response.data;
  }

  async editMessage(messageId: string, payload: { content: string; editorUserId: string }) {
    const response = await firstValueFrom(
      this.httpService.patch(`${this.baseUrl}/messages/${messageId}`, payload),
    );

    return response.data;
  }

  async deleteMessage(messageId: string, deletedByUserId: string) {
    const response = await firstValueFrom(
      this.httpService.delete(`${this.baseUrl}/messages/${messageId}`, {
        data: {
          deletedByUserId,
        },
      }),
    );

    return response.data;
  }

  async reactToMessage(messageId: string, payload: { userId: string; emoji: string }) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/messages/${messageId}/reactions`, payload),
    );

    return response.data;
  }

  async createThread(payload: { rootMessageId: string; channelId: string }) {
    const response = await firstValueFrom(this.httpService.post(`${this.baseUrl}/threads`, payload));

    return response.data;
  }

  async replyToThread(threadId: string, payload: { userId: string; content: string }) {
    const response = await firstValueFrom(
      this.httpService.post(`${this.baseUrl}/threads/${threadId}/replies`, payload),
    );

    return response.data;
  }
}