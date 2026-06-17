import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";

const PROFILE_SELECT = {
  id: true, name: true, email: true, role: true,
  phone: true, avatar: true, isVerified: true, isActive: true, createdAt: true,
  upiId: true, upiName: true,
};

// GET /api/users/profile
export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const profile = await prisma.user.findUnique({
      where: { id: user!.userId },
      select: PROFILE_SELECT,
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
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.phone !== undefined) data.phone = body.phone || null;
    if (body.avatar !== undefined) data.avatar = body.avatar || null;

    if (user!.role === "OWNER" || user!.role === "ADMIN") {
      if (body.upiId !== undefined) data.upiId = body.upiId || null;
      if (body.upiName !== undefined) data.upiName = body.upiName || null;
    }

    const updated = await prisma.user.update({
      where: { id: user!.userId },
      data,
      select: PROFILE_SELECT,
    });

    return apiResponse(updated);
  } catch (err) {
    console.error("Update profile error:", err);
    return apiError("Internal server error", 500);
  }
}
