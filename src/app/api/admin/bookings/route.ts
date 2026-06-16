import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse } from "@/lib/api-helpers";

// GET /api/admin/bookings - all bookings
export async function GET(req: NextRequest) {
  const { error } = requireRole(req, ["ADMIN"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where = status ? { status: status as never } : {};

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          room: { select: { id: true, title: true, city: true } },
          student: { select: { id: true, name: true, email: true } },
          payment: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return apiResponse({
      bookings,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Admin bookings error:", err);
    return apiError("Internal server error", 500);
  }
}
