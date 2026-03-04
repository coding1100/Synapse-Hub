import { PrismaClient } from '@prisma/client';

declare global {
  var __synapsehubPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__synapsehubPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__synapsehubPrisma = prisma;
}
