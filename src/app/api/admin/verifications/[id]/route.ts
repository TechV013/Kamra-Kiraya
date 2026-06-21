import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse } from "@/lib/api-helpers";
import { getSignedUrl } from "@/lib/supabase-storage";
import { sendVerificationApproved, sendVerificationRejected } from "@/lib/email";
import { auditFromRequest } from "@/lib/audit";

const DETAIL_SELECT = {
  id: true, ownerId: true, status: true,
  aadhaarUrl: true, panUrl: true, propertyProofUrl: true,
  rejectionNote: true, reviewedBy: true, reviewedAt: true,
  submittedAt: true, expiresAt: true, createdAt: true, updatedAt: true,
  owner: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
  reviewer: { select: { id: true, name: true } },
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = requireRole(req, ["ADMIN"]);
  if (error) return error;

  try {
    const record = await prisma.ownerVerification.findUnique({
      where: { id: params.id },
      select: DETAIL_SELECT,
    });

    if (!record) return apiError("Verification not found", 404);

    const result: Record<string, unknown> = { ...record };

    if (record.aadhaarUrl) {
      result.aadhaarUrl = await getSignedUrl(record.aadhaarUrl).catch(() => null);
    }
    if (record.panUrl) {
      result.panUrl = await getSignedUrl(record.panUrl).catch(() => null);
    }
    if (record.propertyProofUrl) {
      result.propertyProofUrl = await getSignedUrl(record.propertyProofUrl).catch(() => null);
    }

    const roomCount = await prisma.room.count({ where: { ownerId: record.ownerId } });
    result.owner = { ...record.owner, roomCount };

    return apiResponse(result);
  } catch (err) {
    console.error("Get verification detail error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error, user } = requireRole(req, ["ADMIN"]);
  if (error) return error;

  try {
    const body = await req.json();
    const { action, rejectionNote } = body;

    if (!["approve", "reject"].includes(action)) {
      return apiError("Action must be 'approve' or 'reject'", 400);
    }

    const record = await prisma.ownerVerification.findUnique({
      where: { id: params.id },
      include: { owner: { select: { name: true, email: true } } },
    });

    if (!record) return apiError("Verification not found", 404);
    const ownerName = record.owner.name;
    const ownerEmail = record.owner.email;

    if (action === "approve") {
      await prisma.ownerVerification.update({
        where: { id: params.id },
        data: {
          status: "VERIFIED",
          reviewedBy: user!.userId,
          reviewedAt: new Date(),
          rejectionNote: null,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.notification.create({
        data: {
          userId: record.ownerId,
          title: "Verification Approved",
          message: "Your owner verification has been approved. You can now publish rooms. This verification expires in 1 year.",
          type: "success",
        },
      });

      sendVerificationApproved(ownerEmail, ownerName);

      auditFromRequest(req, user!.userId, "VERIFICATION_REVIEW", "verification", params.id, { action: "approve" });
      return apiResponse({ success: true, status: "VERIFIED" });
    }

    if (!rejectionNote || rejectionNote.trim().length < 10) {
      return apiError("Please provide a detailed rejection note (at least 10 characters)", 400);
    }

    await prisma.ownerVerification.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        reviewedBy: user!.userId,
        reviewedAt: new Date(),
        rejectionNote,
      },
    });

      await prisma.notification.create({
        data: {
          userId: record.ownerId,
          title: "Verification Rejected",
          message: `Your verification was rejected. Reason: ${rejectionNote}. Please resubmit with correct documents.`,
          type: "error",
        },
      });

      sendVerificationRejected(ownerEmail, ownerName, rejectionNote);

      auditFromRequest(req, user!.userId, "VERIFICATION_REVIEW", "verification", params.id, { action: "reject", rejectionNote });
      return apiResponse({ success: true, status: "REJECTED" });
  } catch (err) {
    console.error("Review verification error:", err);
    return apiError("Internal server error", 500);
  }
}
