import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, apiError, apiResponse } from "@/lib/api-helpers";

// Owner's rooms
export async function GET(req: NextRequest) {
  const { error, user } = requireRole(req, ["OWNER", "ADMIN"]);
  if (error) return error;

  try {
    const rooms = await prisma.room.findMany({
      where: { ownerId: user!.userId },
      include: {
        _count: { select: { bookings: true, reviews: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(rooms);
  } catch (err) {
    console.error("Get my rooms error:", err);
    return apiError("Internal server error", 500);
  }
}
