import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { UpdateUserDto } from './dto/update-user.dto';

type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  title?: string;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UsersService {
  private readonly users = new Map<string, UserRecord>();

  getOrCreateUser(userId: string) {
    const existing = this.users.get(userId);
    if (existing) {
      return existing;
    }

    const user: UserRecord = {
      id: userId,
      email: `${userId}@synapsehub.local`,
      displayName: `user-${userId.slice(0, 6)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  createInternal(email: string, displayName: string) {
    const user: UserRecord = {
      id: uuidv4(),
      email,
      displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  getById(id: string) {
    const user = this.users.get(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  updateById(id: string, dto: UpdateUserDto) {
    const user = this.getById(id);
    const updated: UserRecord = {
      ...user,
      ...dto,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  search(q?: string, cursor?: string, limit = 20) {
    const normalizedLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 100)) : 20;
    const sorted = [...this.users.values()].sort((a, b) => a.id.localeCompare(b.id));

    const startIdx = cursor ? Math.max(sorted.findIndex((u) => u.id === cursor) + 1, 0) : 0;
    const filtered = q
      ? sorted.filter((u) =>
          `${u.displayName} ${u.email}`.toLowerCase().includes(q.toLowerCase()),
        )
      : sorted;

    const slice = filtered.slice(startIdx, startIdx + normalizedLimit);
    const nextCursor = slice.length === normalizedLimit ? slice[slice.length - 1].id : null;

    return {
      data: slice,
      paging: {
        cursor: nextCursor,
        limit: normalizedLimit,
      },
    };
  }
}
