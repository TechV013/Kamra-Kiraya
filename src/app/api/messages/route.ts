import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const { error, user } = requireAuth(req);
    if (error) return error;

    const bookingId = req.nextUrl.searchParams.get("bookingId");
    if (!bookingId) return apiError("bookingId is required");

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { studentId: true, room: { select: { ownerId: true } } },
    });
    if (!booking) return apiError("Booking not found", 404);

    if (user!.role !== "ADMIN" && user!.id !== booking.studentId && user!.id !== booking.room.ownerId) {
      return apiError("Forbidden", 403);
    }

    const messages = await prisma.message.findMany({
      where: { bookingId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return apiResponse(messages);
  } catch {
    return apiError("Failed to fetch messages", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, user } = requireAuth(req);
    if (error) return error;

    const body = await req.json();
    const { bookingId, content, type } = body;

    if (!bookingId || !content) {
      return apiError("bookingId and content are required");
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { studentId: true, room: { select: { ownerId: true } } },
    });
    if (!booking) return apiError("Booking not found", 404);

    if (user!.role !== "ADMIN" && user!.id !== booking.studentId && user!.id !== booking.room.ownerId) {
      return apiError("Forbidden", 403);
    }

    const message = await prisma.message.create({
      data: {
        bookingId,
        senderId: user!.id,
        content,
        type: type || "TEXT",
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return apiResponse(message, 201);
  } catch {
    return apiError("Failed to send message", 500);
  }
}
