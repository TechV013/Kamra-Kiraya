import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // ✅ Lazy load Prisma (CRITICAL)
    const { prisma } = await import("@/lib/prisma");

    const id = context?.params?.id;

    if (!id) {
      return apiError("Room ID is required", 400);
    }

    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      return apiError("Room not found", 404);
    }

    return apiResponse(room);
  } catch (err) {
    console.error("GET room error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { prisma } = await import("@/lib/prisma");

    const id = context?.params?.id;
    if (!id) return apiError("Room ID is required", 400);

    const body = await req.json();

    const updated = await prisma.room.update({
      where: { id },
      data: body,
    });

    return apiResponse(updated);
  } catch (err) {
    console.error("PUT room error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { prisma } = await import("@/lib/prisma");

    const id = context?.params?.id;
    if (!id) return apiError("Room ID is required", 400);

    await prisma.room.delete({
      where: { id },
    });

    return apiResponse({ message: "Room deleted" });
  } catch (err) {
    console.error("DELETE room error:", err);
    return apiError("Internal server error", 500);
  }
}
