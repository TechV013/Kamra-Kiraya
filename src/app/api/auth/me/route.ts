import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { error, user } = requireAuth(req);
    if (error) return error;

    if (!user?.userId) {
      return apiError("Unauthorized", 401);
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
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

    if (!userData) {
      return apiError("User not found", 404);
    }

    return apiResponse(userData);
  } catch (err) {
    console.error("Get profile error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { error, user } = requireAuth(req);
    if (error) return error;

    if (!user?.userId) {
      return apiError("Unauthorized", 401);
    }

    const body = await req.json();
    const { name, phone, avatar } = body;

    const updated = await prisma.user.update({
      where: { id: user.userId },
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
