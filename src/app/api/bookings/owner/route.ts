import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse } from "@/lib/api-helpers";

// GET owner bookings
export async function GET(req: NextRequest) {
  const { error, user } = requireRole(req, ["OWNER", "ADMIN"]);
  if (error) return error;

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        room: { ownerId: user!.userId },
      },
      include: {
        room: { select: { id: true, title: true, images: true, priceMonthly: true, priceDaily: true } },
        student: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(bookings);
  } catch (err) {
    console.error("Get owner bookings error:", err);
    return apiError("Internal server error", 500);
  }
}
