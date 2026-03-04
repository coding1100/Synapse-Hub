export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
};

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type Channel = {
  id: string;
  workspaceId: string;
  name: string;
  topic?: string;
  type: 'PUBLIC' | 'PRIVATE' | 'DIRECT';
  isArchived: boolean;
  createdAt: string;
};

export type Message = {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  threadId?: string;
  sequence: number;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
};

export type Notification = {
  id: string;
  userId: string;
  type: 'MENTION' | 'DIRECT_MESSAGE' | 'THREAD_REPLY' | 'CHANNEL_ACTIVITY' | 'SYSTEM';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export type Paginated<T> = {
  data: T[];
  paging: {
    cursor: string | null;
    limit: number;
  };
};