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
  emailVerifiedAt?: string | null;
};

export type UserProfile = AuthUser & {
  title?: string | null;
  timezone?: string | null;
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

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  invitedById?: string | null;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
  };
};

export type WorkspaceInviteLink = {
  id: string;
  workspaceId: string;
  role: WorkspaceRole;
  maxUses?: number | null;
  useCount: number;
  expiresAt: string;
  allowedDomain?: string | null;
  invitedEmail?: string | null;
  isRevoked: boolean;
  inviteUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type Channel = {
  id: string;
  workspaceId: string;
  name: string;
  topic?: string | null;
  type: 'PUBLIC' | 'PRIVATE' | 'DIRECT';
  isArchived: boolean;
  createdAt: string;
  members?: {
    userId: string;
    user?: {
      id: string;
      displayName: string;
      email: string;
      avatarUrl?: string | null;
    };
  }[];
};

export type Message = {
  id: string;
  channelId: string;
  authorId: string;
  author?: {
    id: string;
    displayName: string;
    email?: string;
    avatarUrl?: string | null;
  };
  content: string;
  threadId?: string;
  parentMessageId?: string | null;
  sequence: number;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
};

export type Thread = {
  id: string;
  workspaceId: string;
  channelId: string;
  rootMessageId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

export type ThreadDetails = {
  thread: Thread;
  replies: Message[];
};

export type MessagePin = {
  id: string;
  workspaceId: string;
  channelId: string;
  messageId: string;
  pinnedById: string;
  createdAt: string;
  message: Message;
  pinnedBy: {
    id: string;
    displayName: string;
    email: string;
  };
};

export type Bookmark = {
  id: string;
  userId: string;
  workspaceId: string;
  channelId: string;
  messageId: string;
  createdAt: string;
  updatedAt: string;
  message: Message;
  channel?: {
    id: string;
    name: string;
  };
};

export type MessageDraft = {
  id: string;
  userId: string;
  workspaceId: string;
  channelId: string;
  threadId?: string | null;
  threadKey: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  channel?: {
    id: string;
    name: string;
  };
};

export type ScheduledMessageStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'CANCELED' | 'FAILED';

export type ScheduledMessage = {
  id: string;
  workspaceId: string;
  channelId: string;
  authorId: string;
  threadId?: string | null;
  parentMessageId?: string | null;
  content: string;
  sendAt: string;
  status: ScheduledMessageStatus;
  sentMessageId?: string | null;
  errorMessage?: string | null;
  canceledAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  channel?: {
    id: string;
    name: string;
  };
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
