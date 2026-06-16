import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse } from "@/lib/api-helpers";

// GET /api/admin/users
export async function GET(req: NextRequest) {
  const { error } = requireRole(req, ["ADMIN"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where = role ? { role: role as never } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, role: true,
          isActive: true, isVerified: true, phone: true,
          createdAt: true, _count: { select: { bookings: true, rooms: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return apiResponse({ users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error("Admin users error:", err);
    return apiError("Internal server error", 500);
  }
}
