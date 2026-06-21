import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse, validateBody } from "@/lib/api-helpers";
import { verificationSubmitSchema } from "@/lib/validations";
import { getSignedUrl, deleteFromSupabase } from "@/lib/supabase-storage";
import { notifyAdmins, getOwnerVerificationStatus } from "@/lib/check-owner-verification";
import { auditFromRequest } from "@/lib/audit";

const VERIFICATION_SELECT = {
  id: true, ownerId: true, status: true,
  aadhaarUrl: true, panUrl: true, propertyProofUrl: true,
  rejectionNote: true, reviewedBy: true, reviewedAt: true,
  submittedAt: true, expiresAt: true, createdAt: true, updatedAt: true,
  reviewer: { select: { id: true, name: true } },
};

// GET /api/owner/verification
export async function GET(req: NextRequest) {
  const { error, user } = requireRole(req, ["OWNER", "ADMIN"]);
  if (error) return error;

  try {
    const record = await prisma.ownerVerification.findUnique({
      where: { ownerId: user!.userId },
      select: VERIFICATION_SELECT,
    });

    if (!record) {
      return apiResponse({ status: null, message: "Not submitted yet" });
    }

    const status = await getOwnerVerificationStatus(user!.userId);

    const result: Record<string, unknown> = { ...record, isVerified: status.isVerified };

    if (record.aadhaarUrl) {
      result.aadhaarUrl = await getSignedUrl(record.aadhaarUrl).catch(() => null);
    }
    if (record.panUrl) {
      result.panUrl = await getSignedUrl(record.panUrl).catch(() => null);
    }
    if (record.propertyProofUrl) {
      result.propertyProofUrl = await getSignedUrl(record.propertyProofUrl).catch(() => null);
    }

    return apiResponse(result);
  } catch (err) {
    console.error("Get verification error:", err);
    return apiError("Internal server error", 500);
  }
}

// POST /api/owner/verification
export async function POST(req: NextRequest) {
  const { error, user } = requireRole(req, ["OWNER", "ADMIN"]);
  if (error) return error;

  try {
    const { data, errorResponse } = await validateBody(req, verificationSubmitSchema);
    if (errorResponse) return errorResponse;

    const { aadhaarUrl, panUrl, propertyProofUrl } = data!;

    const existing = await prisma.ownerVerification.findUnique({
      where: { ownerId: user!.userId },
    });

    if (existing) {
      if (existing.status === "UNDER_REVIEW") {
        return apiError("Your verification is already under review", 400);
      }

      if (existing.aadhaarUrl) await deleteFromSupabase(existing.aadhaarUrl).catch(() => {});
      if (existing.panUrl) await deleteFromSupabase(existing.panUrl).catch(() => {});
      if (existing.propertyProofUrl) await deleteFromSupabase(existing.propertyProofUrl).catch(() => {});
    }

    const record = await prisma.ownerVerification.upsert({
      where: { ownerId: user!.userId },
      update: {
        status: "PENDING",
        aadhaarUrl,
        panUrl,
        propertyProofUrl,
        rejectionNote: null,
        reviewedBy: null,
        reviewedAt: null,
        expiresAt: null,
      },
      create: {
        ownerId: user!.userId,
        status: "PENDING",
        aadhaarUrl,
        panUrl,
        propertyProofUrl,
      },
      select: VERIFICATION_SELECT,
    });

    const ownerName = user!.name || "An owner";
    await notifyAdmins(
      "New Verification Request",
      `${ownerName} has submitted verification documents for review.`
    );

    auditFromRequest(req, user!.userId, "VERIFICATION_SUBMIT", "verification", record.id);
    return apiResponse(record, 201);
  } catch (err) {
    console.error("Submit verification error:", err);
    return apiError("Internal server error", 500);
  }
}
