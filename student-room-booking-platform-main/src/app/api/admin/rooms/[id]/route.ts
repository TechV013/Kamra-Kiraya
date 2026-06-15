import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse } from "@/lib/api-helpers";

// PATCH /api/admin/rooms/[id] - approve/reject room
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireRole(req, ["ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!["APPROVED", "REJECTED", "INACTIVE", "PENDING"].includes(status)) {
      return apiError("Invalid status");
    }

    const room = await prisma.room.update({
      where: { id },
      data: { status },
    });

    return apiResponse(room);
  } catch (err) {
    console.error("Admin update room error:", err);
    return apiError("Internal server error", 500);
  }
}
