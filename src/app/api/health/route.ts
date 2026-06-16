import { NextRequest, NextResponse } from "next/server";
import { getDatabaseHealth } from "@/lib/db-test";

/**
 * GET /api/health
 * Health check endpoint that includes database connectivity
 */
export async function GET(req: NextRequest) {
  try {
    const dbHealth = await getDatabaseHealth();

    const systemHealth = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: dbHealth,
    };

    const statusCode = dbHealth.status === "healthy" ? 200 : 503;

    return NextResponse.json(systemHealth, { status: statusCode });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
