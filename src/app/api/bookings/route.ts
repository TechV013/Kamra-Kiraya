import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";
import { differenceInDays } from "date-fns";

// GET /api/bookings - student's bookings
export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const bookings = await prisma.booking.findMany({
      where: { studentId: user!.userId },
      include: {
        room: {
          include: {
            owner: { select: { id: true, name: true, avatar: true } },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(bookings);
  } catch (err) {
    console.error("Get bookings error:", err);
    return apiError("Internal server error", 500);
  }
}

// POST /api/bookings - create booking
export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { roomId, checkIn, checkOut, bookingType, specialNote } = await req.json();

    if (!roomId || !checkIn || !checkOut || !bookingType) {
      return apiError("Required fields missing");
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return apiError("Room not found", 404);
    if (!room.isAvailable || room.availableRooms < 1) {
      return apiError("Room is not available");
    }
    if (room.status !== "APPROVED") {
      return apiError("Room is not approved for booking");
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return apiError("Check-out must be after check-in");
    }

    const totalDays = differenceInDays(checkOutDate, checkInDate);
    let totalAmount: number;

    if (bookingType === "MONTHLY") {
      const months = Math.ceil(totalDays / 30);
      totalAmount = months * room.priceMonthly;
    } else {
      totalAmount = totalDays * room.priceDaily;
    }

    const booking = await prisma.booking.create({
      data: {
        roomId,
        studentId: user!.userId,
        bookingType,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalDays,
        totalAmount,
        specialNote,
        status: "PENDING",
      },
      include: {
        room: true,
        payment: true,
      },
    });

    return apiResponse(booking, 201);
  } catch (err) {
    console.error("Create booking error:", err);
    return apiError("Internal server error", 500);
  }
}
