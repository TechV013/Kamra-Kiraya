import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";
import { signToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const userData = await prisma.user.findUnique({
      where: { id: user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!userData) return apiError("User not found", 404);
    const token = signToken({ userId: userData.id, email: userData.email, role: userData.role });
    return apiResponse({ user: userData, token });
  } catch (err) {
    console.error("Get profile error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PUT(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { name, phone, avatar } = await req.json();

    const updated = await prisma.user.update({
      where: { id: user!.userId },
      data: { name, phone, avatar },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
      },
    });

    return apiResponse(updated);
  } catch (err) {
    console.error("Update profile error:", err);
    return apiError("Internal server error", 500);
  }
}
