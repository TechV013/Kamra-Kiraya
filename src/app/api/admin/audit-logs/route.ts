import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse } from "@/lib/api-helpers";

const ACTION_LABELS: Record<string, string> = {
  USER_LOGIN: "User Login",
  USER_LOGOUT: "User Logout",
  USER_REGISTER: "User Registration",
  PASSWORD_RESET: "Password Reset",
  PASSWORD_RESET_REQUEST: "Password Reset Request",
  ROOM_CREATE: "Room Created",
  ROOM_UPDATE: "Room Updated",
  ROOM_DELETE: "Room Deleted",
  BOOKING_CREATE: "Booking Created",
  BOOKING_APPROVE: "Booking Approved",
  BOOKING_CANCEL: "Booking Cancelled",
  BOOKING_REJECT: "Booking Rejected",
  BOOKING_COMPLETE: "Booking Completed",
  PAYMENT_CREATE: "Payment Initiated",
  PAYMENT_VERIFY: "Payment Verified",
  PAYMENT_APPROVE: "Payment Approved",
  PAYMENT_FAIL: "Payment Failed",
  COMPLAINT_CREATE: "Complaint Filed",
  COMPLAINT_UPDATE: "Complaint Updated",
  ADMIN_ACTION: "Admin Action",
  ADMIN_SETTINGS: "Settings Change",
  VERIFICATION_SUBMIT: "Verification Submitted",
  VERIFICATION_REVIEW: "Verification Reviewed",
  PROFILE_UPDATE: "Profile Updated",
};

const ENTITY_LABELS: Record<string, string> = {
  user: "User",
  room: "Room",
  booking: "Booking",
  payment: "Payment",
  complaint: "Complaint",
  verification: "Verification",
  config: "Configuration",
  platform: "Platform",
};

export async function GET(req: NextRequest) {
  const { error, user } = requireRole(req, ["ADMIN"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30")));

    const where: Record<string, unknown> = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (fromDate || toDate) {
      const createdAt: Record<string, Date> = {};
      if (fromDate) createdAt.gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        createdAt.lte = end;
      }
      where.createdAt = createdAt;
    }
    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const enriched = logs.map((log) => ({
      ...log,
      actionLabel: ACTION_LABELS[log.action] || log.action,
      entityLabel: ENTITY_LABELS[log.entity] || log.entity,
      metadata: typeof log.metadata === "object" ? log.metadata : {},
    }));

    return apiResponse({
      logs: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      actions: ACTION_LABELS,
      entities: ENTITY_LABELS,
    });
  } catch (err) {
    console.error("Get audit logs error:", err);
    return apiError("Internal server error", 500);
  }
}
