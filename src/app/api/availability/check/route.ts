import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/api-helpers";
import { checkAvailability, getAvailabilityCalendar } from "@/lib/inventory";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const mode = searchParams.get("mode") || "range";

    if (!roomId) return apiError("roomId is required", 400);

    if (mode === "calendar" && year && month) {
      const room = await prisma.room.findUnique({ where: { id: roomId }, select: { id: true, title: true, totalRooms: true } });
      if (!room) return apiError("Room not found", 404);
      const calendar = await getAvailabilityCalendar(roomId, parseInt(year), parseInt(month));
      return apiResponse({ room, calendar });
    }

    if (!checkIn || !checkOut) return apiError("checkIn and checkOut are required for range mode", 400);

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return apiError("Invalid date format", 400);
    }
    if (checkOutDate <= checkInDate) return apiError("checkOut must be after checkIn", 400);

    const result = await checkAvailability(roomId, checkInDate, checkOutDate);
    return apiResponse(result);
  } catch (err) {
    console.error("Check availability error:", err);
    return apiError("Internal server error", 500);
  }
}
