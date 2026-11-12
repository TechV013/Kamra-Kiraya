import { prisma } from "./prisma";

export interface DatabaseHealth {
  status: "healthy" | "unhealthy";
  latency: number;
  timestamp: string;
}

/**
 * Lightweight database health probe.
 *
 * Deliberately does not return row counts, table counts or raw driver errors:
 * this endpoint is public, so those details would leak schema and
 * infrastructure information. Details are logged server-side instead.
 */
export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "healthy",
      latency: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      status: "unhealthy",
      latency: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    };
  }
}
