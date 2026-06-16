import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse } from "@/lib/api-helpers";

// PATCH /api/admin/users/[id] - update user status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireRole(req, ["ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;
    const { isActive, isVerified, role } = await req.json();

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return apiError("User not found", 404);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(isVerified !== undefined && { isVerified }),
        ...(role && { role }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return apiResponse(updated);
  } catch (err) {
    console.error("Admin update user error:", err);
    return apiError("Internal server error", 500);
  }
}

// GET /api/admin/users/[id] - get user details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = requireRole(req, ["ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
            rooms: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) return apiError("User not found", 404);
    return apiResponse(user);
  } catch (err) {
    console.error("Get user details error:", err);
    return apiError("Internal server error", 500);
  }
}
