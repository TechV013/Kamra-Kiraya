import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

// ✅ SAFE GET
export async function GET(
  req: NextRequest,
  context: any
) {
  try {
    // 🛑 Prevent crash during build
    if (!context || !context.params) {
      return apiError("Invalid request", 400);
    }

    const id = context.params.id;
    if (!id) return apiError("Room ID required", 400);

    // ✅ Lazy import INSIDE function
    const { prisma } = await import("@/lib/prisma");

    const room = await prisma.room.findUnique({
      where: { id },
    });

    return apiResponse(room);
  } catch (err) {
    console.error("GET ERROR:", err);
    return apiError("Internal server error", 500);
  }
}

// ✅ SAFE PUT
export async function PUT(
  req: NextRequest,
  context: any
) {
  try {
    if (!context || !context.params) {
      return apiError("Invalid request", 400);
    }

    const id = context.params.id;
    if (!id) return apiError("Room ID required", 400);

    const body = await req.json();

    const { prisma } = await import("@/lib/prisma");

    const updated = await prisma.room.update({
      where: { id },
      data: body,
    });

    return apiResponse(updated);
  } catch (err) {
    console.error("PUT ERROR:", err);
    return apiError("Internal server error", 500);
  }
}

// ✅ SAFE DELETE
export async function DELETE(
  req: NextRequest,
  context: any
) {
  try {
    if (!context || !context.params) {
      return apiError("Invalid request", 400);
    }

    const id = context.params.id;
    if (!id) return apiError("Room ID required", 400);

    const { prisma } = await import("@/lib/prisma");

    await prisma.room.delete({
      where: { id },
    });

    return apiResponse({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return apiError("Internal server error", 500);
  }
}
