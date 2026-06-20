import { prisma } from "@/lib/prisma";
import type { VerificationStatus } from "@prisma/client";

export async function getOwnerVerificationStatus(ownerId: string) {
  const record = await prisma.ownerVerification.findUnique({
    where: { ownerId },
  });

  if (!record) {
    return { status: null as VerificationStatus | null, isVerified: false, expiresAt: null };
  }

  const isExpired = record.expiresAt && record.expiresAt < new Date();

  if (isExpired && record.status === "VERIFIED") {
    return { status: null, isVerified: false, expiresAt: null, needsResubmit: true };
  }

  return {
    status: record.status,
    isVerified: record.status === "VERIFIED" && !isExpired,
    expiresAt: record.expiresAt,
    needsResubmit: false,
  };
}

export async function handleExpiredVerification(ownerId: string): Promise<void> {
  const record = await prisma.ownerVerification.findUnique({
    where: { ownerId },
  });

  if (record?.status === "VERIFIED" && record.expiresAt && record.expiresAt < new Date()) {
    await prisma.ownerVerification.update({
      where: { ownerId },
      data: { status: "PENDING", expiresAt: null, aadhaarUrl: null, panUrl: null, propertyProofUrl: null },
    });

    await prisma.notification.create({
      data: {
        userId: ownerId,
        title: "Verification Expired",
        message: "Your owner verification has expired. Please re-submit your documents to continue publishing rooms.",
        type: "info",
      },
    });
  }
}

export async function notifyAdmins(title: string, message: string): Promise<void> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        title,
        message,
        type: "info",
      })),
    });
  }
}
