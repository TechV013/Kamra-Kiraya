import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, apiError, apiResponse } from "@/lib/api-helpers";
import { getOwnerVerificationStatus, handleExpiredVerification } from "@/lib/check-owner-verification";
import { getCityImages } from "@/lib/city-images";
import { auditFromRequest } from "@/lib/audit";

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

    if (body.status && user!.role === "OWNER") {
      if (room.status === "INACTIVE" && (body.status === "PENDING" || body.status === "APPROVED")) {
        await handleExpiredVerification(user!.userId);
        const verification = await getOwnerVerificationStatus(user!.userId);
        if (!verification.isVerified) {
          return apiError("Your account must be verified before publishing rooms. Visit Dashboard > Verification to submit your documents.", 403);
        }
      }
    }

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

    if (body.images !== undefined) {
      const cityForImages = filtered.city || room.city;
      if (Array.isArray(filtered.images) && filtered.images.length === 0) {
        filtered.images = getCityImages(cityForImages as string);
      }
    }

    const updated = await prisma.room.update({
      where: { id },
      data: filtered,
    });

    auditFromRequest(req, user!.userId, "ROOM_UPDATE", "room", id, { changes: Object.keys(filtered) });
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
    auditFromRequest(req, user!.userId, "ROOM_DELETE", "room", id, { title: room.title });
    return apiResponse({ message: "Room deleted" });
  } catch (err) {
    console.error("Delete room error:", err);
    return apiError("Internal server error", 500);
  }
}
