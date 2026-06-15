import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { error, user } = await requireRole(req, ["OWNER", "ADMIN"]);
  if (error) return error;

  try {
    const payments = await prisma.payment.findMany({
      where: {
        booking: {
          room: { ownerId: user!.userId },
        },
      },
      include: {
        booking: {
          include: {
            room: { select: { id: true, title: true, images: true, city: true, state: true } },
            student: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(payments);
  } catch (err) {
    console.error("Get owner payments error:", err);
    return apiError("Internal server error", 500);
  }
}
