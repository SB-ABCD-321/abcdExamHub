
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

declare global {
    var prisma_final_v5: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;

let prismaArgs = {};
if (connectionString) {
    const adapter = new PrismaNeon({ connectionString });
    prismaArgs = { adapter };
}

export const db: PrismaClient =
    globalThis.prisma_final_v5 ||
    new PrismaClient({
        ...prismaArgs,
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma_final_v5 = db;
}
