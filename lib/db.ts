import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient(): PrismaClient {
  if (typeof globalThis.WebSocket !== 'undefined') {
    neonConfig.webSocketConstructor = globalThis.WebSocket;
  } else {
    // Dynamic require for environments without native WebSocket
    try {
      neonConfig.webSocketConstructor = require('ws');
    } catch {
      // Native fallback
    }
  }
  const connectionString = process.env.DATABASE_URL || '';
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
