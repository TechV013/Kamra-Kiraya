import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const { error, user } = requireAuth(req);
    if (error) return error;

    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) return apiError("bookingId is required");

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { studentId: true, room: { select: { ownerId: true } } },
    });
    if (!booking) return apiError("Booking not found", 404);

    if (user!.role !== "ADMIN" && user!.id !== booking.studentId && user!.id !== booking.room.ownerId) {
      return apiError("Forbidden", 403);
    }

    const result = await prisma.message.updateMany({
      where: {
        bookingId,
        senderId: { not: user!.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return apiResponse({ success: true, updated: result.count });
  } catch {
    return apiError("Failed to mark messages as read", 500);
  }
}
