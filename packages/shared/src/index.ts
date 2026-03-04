export type ServiceHealth = {
  service: string;
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
};

export { prisma } from './prisma-client';
export { normalizeLimit, nextCursor } from './pagination';