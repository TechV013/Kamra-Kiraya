import { prisma } from "./prisma";

export interface DatabaseTestResult {
  success: boolean;
  message: string;
  timestamp: string;
  tables?: number;
  latency?: number;
}

/**
 * Test database connectivity
 * Useful for health checks and diagnostics
 */
export async function testDatabaseConnection(): Promise<DatabaseTestResult> {
  const startTime = Date.now();

  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;

    // Count tables
    const result = await prisma.$queryRaw<[{ count: string }]>`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    const tableCount = parseInt(result[0]?.count || "0", 10);
    const latency = Date.now() - startTime;

    return {
      success: true,
      message: `Database connected successfully. ${tableCount} tables found.`,
      timestamp: new Date().toISOString(),
      tables: tableCount,
      latency,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error("Database connection test failed:", errorMessage);

    return {
      success: false,
      message: `Database connection failed: ${errorMessage}`,
      timestamp: new Date().toISOString(),
      latency,
    };
  }
}

/**
 * Test specific database operations
 */
export async function testDatabaseOperations(): Promise<{
  connection: DatabaseTestResult;
  userCount: number;
  roomCount: number;
  bookingCount: number;
}> {
  const connection = await testDatabaseConnection();

  if (!connection.success) {
    throw new Error("Database connection failed");
  }

  try {
    const [users, rooms, bookings] = await Promise.all([
      prisma.user.count(),
      prisma.room.count(),
      prisma.booking.count(),
    ]);

    return {
      connection,
      userCount: users,
      roomCount: rooms,
      bookingCount: bookings,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to query database: ${errorMessage}`);
  }
}

/**
 * Get database health status
 */
export async function getDatabaseHealth() {
  try {
    const result = await testDatabaseOperations();
    return {
      status: "healthy",
      ...result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "unhealthy",
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}
