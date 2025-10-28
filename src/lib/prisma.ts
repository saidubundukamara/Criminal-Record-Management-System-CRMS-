/**
 * Prisma Client Singleton
 *
 * Ensures only one instance of PrismaClient exists throughout the application.
 * Important for connection pooling and preventing "too many connections" errors.
 *
 * Pan-African Design: Works with any PostgreSQL database across different countries
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown handler
 * Ensures database connections are properly closed
 */
async function disconnect() {
  await prisma.$disconnect();
}

// Register shutdown handlers
process.on("beforeExit", disconnect);
process.on("SIGINT", disconnect);
process.on("SIGTERM", disconnect);
