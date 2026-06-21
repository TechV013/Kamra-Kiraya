import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, apiError, apiResponse, validateBody } from "@/lib/api-helpers";
import { complaintCreateSchema } from "@/lib/validations";
import { sendComplaintFiled } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { auditFromRequest } from "@/lib/audit";

const LIST_INCLUDE = {
  complainant: { select: { id: true, name: true } },
  respondent: { select: { id: true, name: true } },
  booking: { select: { id: true, room: { select: { title: true } } } },
};

export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const where: Record<string, unknown> = {};
    if (user!.role === "STUDENT") where.complainantId = user!.userId;
    else if (user!.role === "OWNER") where.respondentId = user!.userId;

    if (status && ["OPEN", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"].includes(status)) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { complainant: { name: { contains: search, mode: "insensitive" } } },
        { respondent: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({ where, include: LIST_INCLUDE, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.complaint.count({ where }),
    ]);

    return apiResponse({ complaints, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error("List complaints error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  const { error, user } = requireRole(req, ["STUDENT", "OWNER", "ADMIN"]);
  if (error) return error;

  const ip = getClientIp(req);
  const limit = rateLimit(ip, { maxRequests: 5, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many complaint submissions. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetIn / 1000)) } }
    );
  }

  try {
    const { data, errorResponse } = await validateBody(req, complaintCreateSchema);
    if (errorResponse) return errorResponse;

    let respondentId = "";

    if (data!.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: data!.bookingId },
        include: { room: { select: { ownerId: true } } },
      });
      if (!booking) return apiError("Booking not found", 404);
      const isParticipant = booking.studentId === user!.userId || booking.room.ownerId === user!.userId;
      if (!isParticipant && user!.role !== "ADMIN") return apiError("You are not a participant in this booking", 403);
      respondentId = booking.studentId === user!.userId ? booking.room.ownerId : booking.studentId;
    } else {
      if (user!.role === "STUDENT") return apiError("Please specify a booking for your complaint", 400);
      const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
      if (admins.length === 0) return apiError("No admin available", 500);
      respondentId = admins[0].id;
    }

    const respondent = await prisma.user.findUnique({ where: { id: respondentId }, select: { role: true, name: true, email: true } });
    if (!respondent) return apiError("Respondent not found", 404);

    const complaint = await prisma.complaint.create({
      data: {
        bookingId: data!.bookingId || null,
        complainantId: user!.userId,
        respondentId,
        category: data!.category,
        title: data!.title,
        description: data!.description,
        attachments: [],
        statusHistory: { create: { toStatus: "OPEN", changedById: user!.userId } },
      },
      include: {
        complainant: { select: { name: true } },
        respondent: { select: { id: true, name: true } },
      },
    });

    await prisma.notification.create({
      data: { userId: respondentId, title: "Complaint Filed", message: `${complaint.complainant.name} filed a complaint: "${complaint.title}"`, type: "warning" },
    });

    const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({ userId: a.id, title: "New Complaint", message: `${complaint.complainant.name} filed a complaint: "${complaint.title}"`, type: "info" })),
      });
    }

    if (respondent.email) {
      sendComplaintFiled(respondent.email, respondent.name, complaint.complainant.name, complaint.title, complaint.id, respondent.role === "OWNER" ? "owner" : "student");
    }

    auditFromRequest(req, user!.userId, "COMPLAINT_CREATE", "complaint", complaint.id, { category: data!.category, respondentId });
    return apiResponse(complaint, 201);
  } catch (err) {
    console.error("Create complaint error:", err);
    return apiError("Internal server error", 500);
  }
}
