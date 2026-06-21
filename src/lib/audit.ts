import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export type AuditAction =
  | "USER_LOGIN" | "USER_LOGOUT" | "USER_REGISTER" | "PASSWORD_RESET" | "PASSWORD_RESET_REQUEST"
  | "ROOM_CREATE" | "ROOM_UPDATE" | "ROOM_DELETE"
  | "BOOKING_CREATE" | "BOOKING_APPROVE" | "BOOKING_CANCEL" | "BOOKING_REJECT" | "BOOKING_COMPLETE"
  | "PAYMENT_CREATE" | "PAYMENT_VERIFY" | "PAYMENT_APPROVE" | "PAYMENT_FAIL"
  | "COMPLAINT_CREATE" | "COMPLAINT_UPDATE"
  | "ADMIN_ACTION" | "ADMIN_SETTINGS"
  | "VERIFICATION_SUBMIT" | "VERIFICATION_REVIEW"
  | "PROFILE_UPDATE";

export type AuditEntity =
  | "user" | "room" | "booking" | "payment" | "complaint" | "verification" | "config" | "platform";

export async function logAudit(params: {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        metadata: params.metadata || {},
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

export function getClientInfo(req: NextRequest): { ipAddress: string; userAgent: string | null } {
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = req.headers.get("user-agent");
  return { ipAddress, userAgent };
}

export function auditFromRequest(
  req: NextRequest,
  userId: string,
  action: AuditAction,
  entity: AuditEntity,
  entityId: string,
  metadata?: Record<string, unknown>
): void {
  const { ipAddress, userAgent } = getClientInfo(req);
  logAudit({ userId, action, entity, entityId, metadata, ipAddress, userAgent });
}
