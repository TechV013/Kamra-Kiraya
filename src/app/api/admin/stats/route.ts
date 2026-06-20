import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse } from "@/lib/api-helpers";

// GET /api/admin/stats
export async function GET(req: NextRequest) {
  const { error } = requireRole(req, ["ADMIN"]);
  if (error) return error;

  try {
    const [
      totalUsers,
      totalRooms,
      totalBookings,
      totalRevenue,
      pendingRooms,
      activeBookings,
      pendingVerifications,
      recentBookings,
      usersByRole,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.room.count(),
      prisma.booking.count(),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "SUCCEEDED" } }),
      prisma.room.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.ownerVerification.count({ where: { status: "PENDING" } }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          room: { select: { title: true, city: true } },
          student: { select: { name: true, email: true } },
          payment: true,
        },
      }),
      prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
    ]);

    return apiResponse({
      stats: {
        totalUsers,
        totalRooms,
        totalBookings,
        totalRevenue: totalRevenue._sum.amount || 0,
        pendingRooms,
        activeBookings,
        pendingVerifications,
      },
      recentBookings,
      usersByRole,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return apiError("Internal server error", 500);
  }
}
