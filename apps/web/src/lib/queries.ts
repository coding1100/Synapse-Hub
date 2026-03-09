import { apiClient } from './api-client';
import {
  AuthResponse,
  Bookmark,
  Channel,
  Message,
  MessageDraft,
  MessagePin,
  Notification,
  Paginated,
  ScheduledMessage,
  ScheduledMessageStatus,
  Thread,
  ThreadDetails,
  UserProfile,
  Workspace,
  WorkspaceInviteLink,
  WorkspaceMember,
  WorkspaceRole,
} from '@/types';

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', {
    email: email.trim(),
    password,
  });
  return data;
}

export async function register(email: string, password: string, displayName: string) {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', {
    email: email.trim(),
    password,
    displayName: displayName.trim(),
  });
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await apiClient.post<{ success: boolean; message: string }>('/auth/forgot-password', {
    email: email.trim(),
  });
  return data;
}

export async function resetPassword(token: string, newPassword: string) {
  const { data } = await apiClient.post<{ success: boolean }>('/auth/reset-password', {
    token,
    newPassword,
  });
  return data;
}

export async function verifyEmail(token: string) {
  const { data } = await apiClient.post<{ success: boolean }>('/auth/verify-email', {
    token,
  });
  return data;
}

export async function resendVerification(email: string) {
  const { data } = await apiClient.post<{ success: boolean; message: string }>('/auth/resend-verification', {
    email: email.trim(),
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

export async function createChannel(payload: {
  workspaceId: string;
  name: string;
  topic?: string;
  isPrivate?: boolean;
  memberIds?: string[];
}) {
  const { data } = await apiClient.post<Channel>('/channels', payload);
  return data;
}

export async function createDirectChannel(workspaceId: string, targetUserId: string) {
  const { data } = await apiClient.post<Channel>('/channels/direct', {
    workspaceId,
    targetUserId,
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

export async function markNotificationRead(notificationId: string) {
  const { data } = await apiClient.patch<Notification>(`/notifications/${notificationId}/read`);
  return data;
}

export async function searchUsers(workspaceId: string, q: string) {
  const { data } = await apiClient.get<Paginated<{ id: string; email: string; displayName: string }>>('/users', {
    params: {
      workspaceId,
      q,
    },
  });
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

export async function getUserProfile(userId: string) {
  const { data } = await apiClient.get<UserProfile>(`/users/${userId}`);
  return data;
}

export async function updateUserProfile(
  userId: string,
  payload: { displayName?: string; title?: string; timezone?: string },
) {
  const { data } = await apiClient.patch<UserProfile>(`/users/${userId}`, payload);
  return data;
}

export async function createThread(rootMessageId: string, channelId: string) {
  const { data } = await apiClient.post<Thread>('/threads', { rootMessageId, channelId });
  return data;
}

export async function getThread(threadId: string) {
  const { data } = await apiClient.get<ThreadDetails>(`/threads/${threadId}`);
  return data;
}

export async function replyToThread(threadId: string, content: string) {
  const { data } = await apiClient.post<Message>(`/threads/${threadId}/replies`, { content });
  return data;
}

export async function pinMessage(messageId: string) {
  const { data } = await apiClient.post<MessagePin>(`/messages/${messageId}/pin`);
  return data;
}

export async function unpinMessage(messageId: string) {
  const { data } = await apiClient.delete<{ messageId: string; unpinned: boolean }>(`/messages/${messageId}/pin`);
  return data;
}

export async function getChannelPins(channelId: string) {
  const { data } = await apiClient.get<{ data: MessagePin[] }>('/messages/pins', {
    params: { channelId },
  });
  return data;
}

export async function createBookmark(messageId: string) {
  const { data } = await apiClient.post<Bookmark>('/bookmarks', { messageId });
  return data;
}

export async function getBookmarks(workspaceId: string, channelId?: string, cursor?: string, limit = 50) {
  const { data } = await apiClient.get<Paginated<Bookmark>>('/bookmarks', {
    params: {
      workspaceId,
      channelId,
      cursor,
      limit,
    },
  });
  return data;
}

export async function deleteBookmark(bookmarkId: string) {
  const { data } = await apiClient.delete<{ id: string; deleted: boolean }>(`/bookmarks/${bookmarkId}`);
  return data;
}

export async function upsertDraft(channelId: string, content: string, threadId?: string) {
  const { data } = await apiClient.put<MessageDraft | { deleted: boolean; channelId: string; threadId: string | null }>(
    '/drafts',
    {
      channelId,
      content,
      threadId,
    },
  );
  return data;
}

export async function getDrafts(workspaceId: string, channelId?: string) {
  const { data } = await apiClient.get<MessageDraft[]>('/drafts', {
    params: {
      workspaceId,
      channelId,
    },
  });
  return data;
}

export async function deleteDraft(channelId: string, threadId?: string) {
  const { data } = await apiClient.delete<{ deleted: boolean; channelId: string; threadId: string | null }>('/drafts', {
    params: {
      channelId,
      threadId,
    },
  });
  return data;
}

export async function scheduleMessage(channelId: string, content: string, sendAt: string, threadId?: string) {
  const { data } = await apiClient.post<ScheduledMessage>('/scheduled-messages', {
    channelId,
    content,
    sendAt,
    threadId,
  });
  return data;
}

export async function getScheduledMessages(
  workspaceId: string,
  channelId?: string,
  status?: ScheduledMessageStatus,
  cursor?: string,
  limit = 50,
) {
  const { data } = await apiClient.get<Paginated<ScheduledMessage>>('/scheduled-messages', {
    params: {
      workspaceId,
      channelId,
      status,
      cursor,
      limit,
    },
  });
  return data;
}

export async function cancelScheduledMessage(scheduledMessageId: string) {
  const { data } = await apiClient.post<ScheduledMessage>(`/scheduled-messages/${scheduledMessageId}/cancel`);
  return data;
}

export async function getWorkspaceMembers(workspaceId: string) {
  const { data } = await apiClient.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
  return data;
}

export async function inviteWorkspaceMember(
  workspaceId: string,
  email: string,
  role: WorkspaceRole = 'MEMBER',
) {
  const { data } = await apiClient.post<
    | { mode: 'MEMBER_ADDED'; member: WorkspaceMember }
    | { mode: 'LINK_SENT'; email: string; inviteLink: WorkspaceInviteLink }
  >(`/workspaces/${workspaceId}/invite`, {
    email,
    role,
  });
  return data;
}

export async function createWorkspaceInviteLink(
  workspaceId: string,
  payload: {
    role: WorkspaceRole;
    expiresInHours: number;
    maxUses?: number;
    allowedDomain?: string;
  },
) {
  const { data } = await apiClient.post<WorkspaceInviteLink>(`/workspaces/${workspaceId}/invite-links`, payload);
  return data;
}

export async function listWorkspaceInviteLinks(workspaceId: string) {
  const { data } = await apiClient.get<WorkspaceInviteLink[]>(`/workspaces/${workspaceId}/invite-links`);
  return data;
}

export async function revokeWorkspaceInviteLink(workspaceId: string, inviteLinkId: string) {
  const { data } = await apiClient.post<WorkspaceInviteLink>(
    `/workspaces/${workspaceId}/invite-links/${inviteLinkId}/revoke`,
  );
  return data;
}

export async function acceptWorkspaceInviteLink(code: string) {
  const { data } = await apiClient.post<{
    success: boolean;
    alreadyAccepted: boolean;
    workspaceId: string;
    role: WorkspaceRole;
  }>(`/workspaces/invite-links/${encodeURIComponent(code)}/accept`);
  return data;
}
