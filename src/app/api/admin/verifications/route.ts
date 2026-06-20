import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse } from "@/lib/api-helpers";

const LIST_SELECT = {
  id: true, ownerId: true, status: true, submittedAt: true, reviewedAt: true, expiresAt: true,
  owner: { select: { id: true, name: true, email: true, phone: true } },
};

export async function GET(req: NextRequest) {
  const { error } = requireRole(req, ["ADMIN"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const where: Record<string, unknown> = {};

    if (status && ["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"].includes(status)) {
      where.status = status;
    }

    if (search) {
      where.owner = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [records, total] = await Promise.all([
      prisma.ownerVerification.findMany({
        where,
        select: LIST_SELECT,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: "desc" },
      }),
      prisma.ownerVerification.count({ where }),
    ]);

    return apiResponse({
      records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Admin verifications error:", err);
    return apiError("Internal server error", 500);
  }
}
