import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";

// GET wishlist
export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: user!.userId },
      include: {
        room: {
          include: {
            owner: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(wishlist);
  } catch (err) {
    console.error("Get wishlist error:", err);
    return apiError("Internal server error", 500);
  }
}

// POST wishlist - toggle
export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { roomId } = await req.json();
    if (!roomId) return apiError("Room ID is required");

    const existing = await prisma.wishlist.findUnique({
      where: { userId_roomId: { userId: user!.userId, roomId } },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { userId_roomId: { userId: user!.userId, roomId } },
      });
      return apiResponse({ message: "Removed from wishlist", added: false });
    } else {
      await prisma.wishlist.create({
        data: { userId: user!.userId, roomId },
      });
      return apiResponse({ message: "Added to wishlist", added: true }, 201);
    }
  } catch (err) {
    console.error("Toggle wishlist error:", err);
    return apiError("Internal server error", 500);
  }
}
