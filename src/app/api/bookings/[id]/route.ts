import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";

// GET /api/bookings/[id]
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

// PATCH /api/bookings/[id] - update status
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

    // Students can only cancel
    if (isStudent && status !== "CANCELLED") {
      return apiError("Students can only cancel bookings", 403);
    }

    // Owners can confirm/reject/complete
    if (isOwner && !["CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) {
      return apiError("Invalid status", 400);
    }

    if (!isOwner && !isStudent && !isAdmin) {
      return apiError("Forbidden", 403);
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
      include: { room: true, student: true, payment: true },
    });

    return apiResponse(updated);
  } catch (err) {
    console.error("Update booking error:", err);
    return apiError("Internal server error", 500);
  }
}
