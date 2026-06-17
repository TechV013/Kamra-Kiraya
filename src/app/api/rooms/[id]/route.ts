import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, apiError, apiResponse } from "@/lib/api-helpers";

// GET /api/rooms/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, avatar: true, phone: true, email: true } },
        reviews: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: { select: { reviews: true, bookings: true } },
      },
    });

    if (!room) return apiError("Room not found", 404);
    return apiResponse(room);
  } catch (err) {
    console.error("Get room error:", err);
    return apiError("Internal server error", 500);
  }
}

// PUT /api/rooms/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { id } = await params;
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return apiError("Room not found", 404);

    if (room.ownerId !== user!.userId && user!.role !== "ADMIN") {
      return apiError("Forbidden", 403);
    }

    const body = await req.json();
    const allowedFields = [
      "title", "description", "address", "city", "state", "zipCode",
      "latitude", "longitude", "priceDaily", "priceMonthly", "roomType",
      "maxOccupancy", "totalRooms", "availableRooms", "images", "amenities",
      "rules", "isAvailable",
    ];
    const filtered: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) filtered[key] = body[key];
    }
    if (filtered.priceDaily !== undefined) filtered.priceDaily = parseFloat(filtered.priceDaily as string);
    if (filtered.priceMonthly !== undefined) filtered.priceMonthly = parseFloat(filtered.priceMonthly as string);

    const updated = await prisma.room.update({
      where: { id },
      data: filtered,
    });

    return apiResponse(updated);
  } catch (err) {
    console.error("Update room error:", err);
    return apiError("Internal server error", 500);
  }
}

// DELETE /api/rooms/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { id } = await params;
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) return apiError("Room not found", 404);

    if (room.ownerId !== user!.userId && user!.role !== "ADMIN") {
      return apiError("Forbidden", 403);
    }

    await prisma.room.delete({ where: { id } });
    return apiResponse({ message: "Room deleted" });
  } catch (err) {
    console.error("Delete room error:", err);
    return apiError("Internal server error", 500);
  }
}
