import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse, validateBody } from "@/lib/api-helpers";
import { complaintMessageSchema } from "@/lib/validations";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const complaint = await prisma.complaint.findUnique({ where: { id: params.id } });
    if (!complaint) return apiError("Complaint not found", 404);

    const isParticipant = complaint.complainantId === user!.userId || complaint.respondentId === user!.userId;
    if (!isParticipant && user!.role !== "ADMIN") return apiError("Forbidden", 403);

    if (complaint.status === "CLOSED") return apiError("This complaint is closed", 400);

    const { data, errorResponse } = await validateBody(req, complaintMessageSchema);
    if (errorResponse) return errorResponse;

    const message = await prisma.complaintMessage.create({
      data: {
        complaintId: params.id,
        senderId: user!.userId,
        message: data!.message,
        attachments: [],
      },
      include: { sender: { select: { id: true, name: true, avatar: true, role: true } } },
    });

    const notifyUserId = complaint.complainantId === user!.userId ? complaint.respondentId : complaint.complainantId;
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        title: "New Response on Complaint",
        message: `${message.sender.name} responded to "${complaint.title}"`,
        type: "info",
      },
    });

    return apiResponse(message, 201);
  } catch (err) {
    console.error("Create complaint message error:", err);
    return apiError("Internal server error", 500);
  }
}
