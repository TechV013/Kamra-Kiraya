import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";
import { getAvailabilityCalendar, setRoomAvailability } from "@/lib/inventory";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = requireAuth(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));

    const room = await prisma.room.findUnique({ where: { id: params.id } });
    if (!room) return apiError("Room not found", 404);

    const calendar = await getAvailabilityCalendar(params.id, year, month);
    return apiResponse({ room: { id: room.id, title: room.title, totalRooms: room.totalRooms, availableRooms: room.availableRooms }, calendar });
  } catch (err) {
    console.error("Get availability error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const room = await prisma.room.findUnique({ where: { id: params.id }, select: { ownerId: true } });
    if (!room) return apiError("Room not found", 404);
    if (room.ownerId !== user!.userId && user!.role !== "ADMIN") return apiError("Forbidden", 403);

    const body = await req.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return apiError("Updates array is required", 400);
    }

    for (const update of updates) {
      if (!update.date) return apiError("Each update must have a date", 400);
    }

    await setRoomAvailability(params.id, updates);
    return apiResponse({ success: true });
  } catch (err: any) {
    console.error("Set availability error:", err);
    const message = err?.message || "Internal server error";
    return apiError(message, 400);
  }
}
