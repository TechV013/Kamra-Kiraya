import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";

// GET /api/users/profile
export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const profile = await prisma.user.findUnique({
      where: { id: user!.userId },
      select: {
        id: true, name: true, email: true, role: true,
        phone: true, avatar: true, isVerified: true, isActive: true, createdAt: true,
      },
    });

    if (!profile) return apiError("User not found", 404);
    return apiResponse(profile);
  } catch (err) {
    console.error("Get profile error:", err);
    return apiError("Internal server error", 500);
  }
}

// PATCH /api/users/profile
export async function PATCH(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { name, phone, avatar } = await req.json();

    const updated = await prisma.user.update({
      where: { id: user!.userId },
      data: { name, phone, avatar },
      select: {
        id: true, name: true, email: true, role: true,
        phone: true, avatar: true, isVerified: true, createdAt: true,
      },
    });

    return apiResponse(updated);
  } catch (err) {
    console.error("Update profile error:", err);
    return apiError("Internal server error", 500);
  }
}
