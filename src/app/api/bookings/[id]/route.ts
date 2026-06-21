import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";
import { sendBookingConfirmationStudent } from "@/lib/email";
import { checkAvailability, reserveInventory, releaseInventory } from "@/lib/inventory";
import { auditFromRequest } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            owner: { select: { id: true, name: true, avatar: true, phone: true, email: true } },
          },
        },
        student: { select: { id: true, name: true, email: true, avatar: true, phone: true } },
        payment: true,
      },
    });

    if (!booking) return apiError("Booking not found", 404);

    const isOwner = booking.room.ownerId === user!.userId;
    const isStudent = booking.studentId === user!.userId;
    const isAdmin = user!.role === "ADMIN";

    if (!isOwner && !isStudent && !isAdmin) {
      return apiError("Forbidden", 403);
    }

    return apiResponse(booking);
  } catch (err) {
    console.error("Get booking error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { id } = await params;
    const { status } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!booking) return apiError("Booking not found", 404);

    const isOwner = booking.room.ownerId === user!.userId;
    const isStudent = booking.studentId === user!.userId;
    const isAdmin = user!.role === "ADMIN";

    if (isOwner && isStudent && status === "CONFIRMED") {
      return apiError("You cannot approve your own booking", 403);
    }

    if (isStudent && !isOwner && status !== "CANCELLED") {
      return apiError("Students can only cancel bookings", 403);
    }

    if (isOwner && !["CONFIRMED", "REJECTED", "CANCELLED", "COMPLETED"].includes(status)) {
      return apiError("Invalid status", 400);
    }

    if (isOwner && status === "CONFIRMED" && booking.status !== "PENDING") {
      return apiError("Can only approve pending requests", 400);
    }

    if (isOwner && status === "REJECTED" && booking.status !== "PENDING") {
      return apiError("Can only reject pending requests", 400);
    }

    if (isOwner && status === "CONFIRMED" && booking.room.availableRooms < 1) {
      return apiError("No available rooms to confirm booking", 400);
    }

    if (!isOwner && !isStudent && !isAdmin) {
      return apiError("Forbidden", 403);
    }

    let roomUpdate = undefined;

    if (status === "CONFIRMED" && booking.status !== "CONFIRMED" && booking.status !== "COMPLETED") {
      const availability = await checkAvailability(booking.roomId, booking.checkIn, booking.checkOut, booking.id);
      if (!availability.available) {
        return apiError("Cannot confirm booking: room is fully booked for these dates", 400);
      }

      const reserved = await reserveInventory(booking.roomId, booking.checkIn, booking.checkOut, booking.id);
      if (!reserved) {
        return apiError("Failed to reserve inventory for this booking", 500);
      }

      roomUpdate = {
        update: {
          availableRooms: { decrement: 1 },
          isAvailable: booking.room.availableRooms <= 1 ? false : true,
        },
      };
    } else if (status === "CANCELLED" && (booking.status === "CONFIRMED" || booking.status === "COMPLETED")) {
      await releaseInventory(booking.roomId, booking.checkIn, booking.checkOut);

      roomUpdate = {
        update: {
          availableRooms: { increment: 1 },
          isAvailable: true,
        },
      };
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status,
        ...(roomUpdate ? { room: roomUpdate } : {}),
      },
      include: { room: true, student: true, payment: true },
    });

    if (status === "CONFIRMED" && booking.status !== "CONFIRMED") {
      sendBookingConfirmationStudent(updated.student.email, updated.student.name, updated.room.title, id, updated.totalAmount);
    }

    const statusToAction: Record<string, string> = { CONFIRMED: "BOOKING_APPROVE", CANCELLED: "BOOKING_CANCEL", REJECTED: "BOOKING_REJECT", COMPLETED: "BOOKING_COMPLETE" };
    const auditAction = statusToAction[status];
    if (auditAction) {
      auditFromRequest(req, user!.userId, auditAction as any, "booking", id, { previousStatus: booking.status, newStatus: status });
    }

    return apiResponse(updated);
  } catch (err) {
    console.error("Update booking error:", err);
    return apiError("Internal server error", 500);
  }
}
