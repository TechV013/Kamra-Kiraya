import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse, validateBody } from "@/lib/api-helpers";
import { bookingSchema } from "@/lib/validations";
import { differenceInDays, isValid } from "date-fns";
import { sendBookingNotificationOwner } from "@/lib/email";

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
    const { data, errorResponse } = await validateBody(req, bookingSchema);
    if (errorResponse) return errorResponse;

    const { roomId, checkIn, checkOut, bookingType, specialNote } = data!;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return apiError("Check-out must be after check-in");
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return apiError("Room not found", 404);

    if (!room.isAvailable || room.availableRooms < 1) {
      return apiError("Room is not available");
    }
    if (room.status !== "APPROVED") {
      return apiError("Room is not approved for booking");
    }

    // Check for overlapping confirmed/completed bookings
    const overlappingBookingsCount = await prisma.booking.count({
      where: {
        roomId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    });

    if (overlappingBookingsCount >= room.totalRooms) {
      return apiError("Room is fully booked for the selected dates");
    }

    const totalDays = differenceInDays(checkOutDate, checkInDate);
    if (totalDays < 1) {
      return apiError("Check-out must be at least one day after check-in");
    }

    if (Number.isNaN(totalDays)) {
      return apiError("Unable to calculate booking duration");
    }

    if (typeof room.priceDaily !== "number" || typeof room.priceMonthly !== "number") {
      return apiError("Room pricing information is not available");
    }

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
        room: {
          include: { owner: { select: { name: true, email: true } } },
        },
        payment: true,
      },
    });

    const student = await prisma.user.findUnique({ where: { id: user!.userId }, select: { name: true } });
    if (student) {
      sendBookingNotificationOwner(booking.room.owner.email, booking.room.owner.name, student.name, booking.room.title);
    }

    return apiResponse(booking, 201);
  } catch (err) {
    console.error("Create booking error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return apiError(`Internal server error: ${message}`, 500);
  }
}
