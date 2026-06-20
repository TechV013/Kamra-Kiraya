import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error || !user) return error || apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("bookingId");

  try {
    if (bookingId) {
      const count = await prisma.message.count({
        where: { bookingId, isRead: false, senderId: { not: user.userId } },
      });
      return apiResponse({ unread: count });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [{ studentId: user.userId }, { room: { ownerId: user.userId } }],
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { id: true },
    });

    const bookingIds = bookings.map((b) => b.id);
    const unreadCounts = await prisma.message.groupBy({
      by: ["bookingId"],
      where: { bookingId: { in: bookingIds }, isRead: false, senderId: { not: user.userId } },
      _count: { id: true },
    });

    const perBooking: Record<string, number> = {};
    let total = 0;
    for (const u of unreadCounts) {
      perBooking[u.bookingId] = u._count.id;
      total += u._count.id;
    }

    return apiResponse({ total, perBooking });
  } catch (err) {
    console.error("Unread error:", err);
    return apiError("Internal server error", 500);
  }
}
