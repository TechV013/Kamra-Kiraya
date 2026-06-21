import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse, validateBody } from "@/lib/api-helpers";
import { bookingSchema } from "@/lib/validations";
import { differenceInDays, isValid } from "date-fns";
import { sendBookingNotificationOwner } from "@/lib/email";
import { checkAvailability } from "@/lib/inventory";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { auditFromRequest } from "@/lib/audit";

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

export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const ip = getClientIp(req);
  const limit = rateLimit(ip, { maxRequests: 10, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many booking requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetIn / 1000)) } }
    );
  }

  try {
    const { data, errorResponse } = await validateBody(req, bookingSchema);
    if (errorResponse) return errorResponse;

    const { roomId, checkIn, checkOut, bookingType, specialNote } = data!;

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return apiError("Check-out must be after check-in");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      return apiError("Check-in cannot be in the past");
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) return apiError("Room not found", 404);

    if (!room.isAvailable || room.availableRooms < 1) {
      return apiError("Room is not available");
    }
    if (room.status !== "APPROVED") {
      return apiError("Room is not approved for booking");
    }

    const availability = await checkAvailability(roomId, checkInDate, checkOutDate);
    if (!availability.available) {
      return apiError(availability.message || "Room is not available for the selected dates");
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

    auditFromRequest(req, user!.userId, "BOOKING_CREATE", "booking", booking.id, { roomId, bookingType, totalAmount });
    return apiResponse(booking, 201);
  } catch (err) {
    console.error("Create booking error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return apiError(`Internal server error: ${message}`, 500);
  }
}
