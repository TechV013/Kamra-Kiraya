import { NextResponse } from "next/server";
import { getDatabaseHealth } from "@/lib/db-test";

/**
 * GET /api/health
 *
 * Public liveness/readiness probe. Returns no counts, schema details or raw
 * error messages.
 */
export async function GET() {
  const database = await getDatabaseHealth();

  return NextResponse.json(
    {
      status: database.status === "healthy" ? "ok" : "degraded",
      timestamp: database.timestamp,
      database: {
        status: database.status,
        latency: database.latency,
      },
    },
    { status: database.status === "healthy" ? 200 : 503 }
  );
}
