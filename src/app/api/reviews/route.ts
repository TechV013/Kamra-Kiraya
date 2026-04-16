import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";

// GET /api/reviews?roomId=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    const reviews = await prisma.review.findMany({
      where: roomId ? { roomId } : {},
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(reviews);
  } catch (err) {
    console.error("Get reviews error:", err);
    return apiError("Internal server error", 500);
  }
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { roomId, rating, comment } = await req.json();

    if (!roomId || !rating || !comment) {
      return apiError("Room ID, rating, and comment are required");
    }

    if (rating < 1 || rating > 5) {
      return apiError("Rating must be between 1 and 5");
    }

    // Check if user booked this room
    const booking = await prisma.booking.findFirst({
      where: {
        roomId,
        studentId: user!.userId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
    });

    if (!booking) {
      return apiError("You must have a confirmed booking to leave a review");
    }

    const review = await prisma.review.upsert({
      where: { roomId_userId: { roomId, userId: user!.userId } },
      update: { rating, comment },
      create: {
        roomId,
        userId: user!.userId,
        rating,
        comment,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Update room average rating
    const stats = await prisma.review.aggregate({
      where: { roomId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.room.update({
      where: { id: roomId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count,
      },
    });

    return apiResponse(review, 201);
  } catch (err) {
    console.error("Create review error:", err);
    return apiError("Internal server error", 500);
  }
}
