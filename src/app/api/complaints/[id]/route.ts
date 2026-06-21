import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse, validateBody } from "@/lib/api-helpers";
import { complaintStatusSchema } from "@/lib/validations";
import { sendComplaintResolved, sendComplaintEscalated } from "@/lib/email";
import { auditFromRequest } from "@/lib/audit";

const DETAIL_INCLUDE = {
  complainant: { select: { id: true, name: true, email: true, avatar: true } },
  respondent: { select: { id: true, name: true, email: true, avatar: true } },
  booking: { select: { id: true, room: { select: { id: true, title: true } } } },
  resolver: { select: { id: true, name: true } },
  closer: { select: { id: true, name: true } },
  messages: {
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, avatar: true, role: true } } },
  },
  statusHistory: {
    orderBy: { createdAt: "desc" },
    include: { changedBy: { select: { id: true, name: true, role: true } } },
  },
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const complaint = await prisma.complaint.findUnique({ where: { id: params.id }, include: DETAIL_INCLUDE });
    if (!complaint) return apiError("Complaint not found", 404);

    const isParticipant = complaint.complainantId === user!.userId || complaint.respondentId === user!.userId;
    if (!isParticipant && user!.role !== "ADMIN") return apiError("Forbidden", 403);

    return apiResponse(complaint);
  } catch (err) {
    console.error("Get complaint error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: params.id },
      include: { complainant: { select: { name: true, email: true } }, respondent: { select: { name: true, email: true } } },
    });
    if (!complaint) return apiError("Complaint not found", 404);

    const isComplainant = complaint.complainantId === user!.userId;
    const isRespondent = complaint.respondentId === user!.userId;
    const isAdmin = user!.role === "ADMIN";

    if (!isComplainant && !isRespondent && !isAdmin) return apiError("Forbidden", 403);

    const { data, errorResponse } = await validateBody(req, complaintStatusSchema);
    if (errorResponse) return errorResponse;

    const newStatus = data!.status;
    const note = data!.note || null;

    if (newStatus === complaint.status) return apiError("Complaint is already in this status", 400);

    if (isComplainant && newStatus !== "RESOLVED") return apiError("You can only mark your complaint as resolved", 403);
    if (isRespondent && !isAdmin && newStatus !== "RESOLVED") return apiError("You can only mark as resolved", 403);
    if (isRespondent && isComplainant) return apiError("You cannot act on your own complaint", 403);

    if ((newStatus === "RESOLVED" || newStatus === "CLOSED") && user!.role !== "ADMIN" && !note) {
      return apiError("Please provide a resolution note", 400);
    }

    if (newStatus === "CLOSED" && !isAdmin) return apiError("Only admins can close complaints", 403);
    if (newStatus === "ESCALATED" && !isAdmin) return apiError("Only admins can escalate complaints", 403);
    if (newStatus === "IN_PROGRESS" && !isAdmin) return apiError("Only admins can set in-progress", 403);

    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === "ESCALATED") updateData.escalatedAt = new Date();
    if (newStatus === "RESOLVED") {
      updateData.resolvedById = user!.userId;
      updateData.resolvedAt = new Date();
      updateData.resolution = note;
    }
    if (newStatus === "CLOSED") {
      updateData.closedById = user!.userId;
      updateData.closedAt = new Date();
      if (complaint.status !== "RESOLVED") {
        updateData.resolvedById = user!.userId;
        updateData.resolvedAt = new Date();
      }
    }

    await prisma.complaint.update({
      where: { id: params.id },
      data: {
        ...updateData,
        statusHistory: { create: { fromStatus: complaint.status, toStatus: newStatus, changedById: user!.userId, note } },
      },
    });

    const notifyUserId = isComplainant ? complaint.respondentId : complaint.complainantId;
    const notifyUser = isComplainant ? complaint.respondent : complaint.complainant;

    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        title: `Complaint ${newStatus === "RESOLVED" ? "Resolved" : newStatus === "ESCALATED" ? "Escalated" : "Updated"}`,
        message: `Complaint "${complaint.title}" status changed to ${newStatus}.${note ? ` Note: ${note}` : ""}`,
        type: newStatus === "RESOLVED" ? "success" : newStatus === "ESCALATED" ? "warning" : "info",
      },
    });

    if (newStatus === "RESOLVED" && notifyUser.email) {
      sendComplaintResolved(notifyUser.email, notifyUser.name, complaint.title, params.id);
    }
    if (newStatus === "ESCALATED") {
      if (complaint.complainant.email) sendComplaintEscalated(complaint.complainant.email, complaint.complainant.name, complaint.title, params.id);
      if (complaint.respondent.email) sendComplaintEscalated(complaint.respondent.email, complaint.respondent.name, complaint.title, params.id);
    }

    auditFromRequest(req, user!.userId, "COMPLAINT_UPDATE", "complaint", params.id, { fromStatus: complaint.status, toStatus: newStatus, note });
    return apiResponse({ success: true, status: newStatus });
  } catch (err) {
    console.error("Update complaint error:", err);
    return apiError("Internal server error", 500);
  }
}
