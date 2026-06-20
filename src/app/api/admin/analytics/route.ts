import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error } = requireRole(req, ["ADMIN"]);
  if (error) return error;

  try {
    const now = new Date();
    const months = 12;
    const monthlyData = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const [revenueAgg, bookingCount, userCount] = await Promise.all([
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { createdAt: { gte: start, lt: end }, status: "SUCCEEDED" },
        }),
        prisma.booking.count({
          where: { createdAt: { gte: start, lt: end } },
        }),
        prisma.user.count({
          where: { createdAt: { gte: start, lt: end } },
        }),
      ]);

      monthlyData.push({
        month: start.toLocaleString("default", { month: "short", year: "2-digit" }),
        revenue: revenueAgg._sum.amount || 0,
        bookings: bookingCount,
        newUsers: userCount,
      });
    }

    const topCities = await prisma.room.groupBy({
      by: ["city"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const roomsByStatus = await prisma.room.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const bookingsByStatus = await prisma.booking.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    return apiResponse({ data: { monthlyData, topCities, roomsByStatus, bookingsByStatus } });
  } catch (err) {
    console.error("Analytics error:", err);
    return apiError("Internal server error", 500);
  }
}
