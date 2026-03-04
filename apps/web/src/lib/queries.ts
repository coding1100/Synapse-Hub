import { apiClient } from './api-client';
import { AuthResponse, Channel, Message, Notification, Paginated, Workspace } from '@/types';

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function register(email: string, password: string, displayName: string) {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', {
    email,
    password,
    displayName,
  });
  return data;
}

export async function getWorkspaces() {
  const { data } = await apiClient.get<Paginated<Workspace>>('/workspaces');
  return data;
}

export async function getChannels(workspaceId: string) {
  const { data } = await apiClient.get<Paginated<Channel>>('/channels', {
    params: { workspaceId },
  });
  return data;
}

export async function getMessages(channelId: string) {
  const { data } = await apiClient.get<Paginated<Message>>('/messages', {
    params: { channelId },
  });
  return data;
}

export async function getNotifications(userId: string) {
  const { data } = await apiClient.get<{ data: Notification[]; unreadCount: number }>(
    `/notifications/${userId}`,
  );
  return data;
}

export async function searchAll(workspaceId: string, q: string, type?: string) {
  const { data } = await apiClient.get('/search', {
    params: {
      workspaceId,
      q,
      type,
    },
  });
  return data;
}