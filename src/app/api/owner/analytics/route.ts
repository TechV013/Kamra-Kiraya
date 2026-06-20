import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error || !user) return error || apiError("Unauthorized", 401);
  if (user.role !== "OWNER") return apiError("Forbidden", 403);

  try {
    const now = new Date();
    const monthlyData = [];

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const [revenueAgg, bookingCount] = await Promise.all([
        prisma.payment.aggregate({
          _sum: { ownerPayout: true },
          where: {
            booking: { room: { ownerId: user.userId } },
            createdAt: { gte: start, lt: end },
            status: "SUCCEEDED",
          },
        }),
        prisma.booking.count({
          where: { room: { ownerId: user.userId }, createdAt: { gte: start, lt: end }, status: { not: "REJECTED" } },
        }),
      ]);

      monthlyData.push({
        month: start.toLocaleString("default", { month: "short", year: "2-digit" }),
        payout: revenueAgg._sum.ownerPayout || 0,
        bookings: bookingCount,
      });
    }

    const rooms = await prisma.room.findMany({
      where: { ownerId: user.userId },
      select: { id: true, title: true, status: true, priceMonthly: true, city: true, images: true, _count: { select: { bookings: true } } },
    });

    const totalEarnings = monthlyData.reduce((s, m) => s + m.payout, 0);
    const totalBookings = monthlyData.reduce((s, m) => s + m.bookings, 0);

    return apiResponse({ data: { monthlyData, rooms, totalEarnings, totalBookings } });
  } catch (err) {
    console.error("Owner analytics error:", err);
    return apiError("Internal server error", 500);
  }
}
