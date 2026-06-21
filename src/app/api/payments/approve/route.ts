import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, apiError, apiResponse } from "@/lib/api-helpers";
import { auditFromRequest } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { error, user } = await requireRole(req, ["OWNER", "ADMIN"]);
  if (error) return error;

  try {
    const { paymentId, action } = await req.json();

    if (!paymentId || !action) {
      return apiError("paymentId and action are required");
    }

    if (action !== "approve" && action !== "reject") {
      return apiError("action must be 'approve' or 'reject'");
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: { include: { room: true } } },
    });

    if (!payment) {
      return apiError("Payment not found", 404);
    }

    if (payment.status !== "VERIFICATION_PENDING") {
      return apiError("Payment is not pending verification", 400);
    }

    if (user!.role === "OWNER" && payment.booking.room.ownerId !== user!.userId) {
      return apiError("You can only verify payments for your own rooms", 403);
    }

    if (user!.role === "OWNER" && payment.booking.studentId === user!.userId) {
      return apiError("You cannot approve your own booking payment", 403);
    }

    if (action === "approve") {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "SUCCEEDED" },
      });

      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
      });

      await prisma.notification.create({
        data: {
          userId: payment.booking.studentId,
          title: "Payment Confirmed!",
          message: `Your payment of ₹${payment.amount.toLocaleString()} has been verified. Your booking is now confirmed!`,
          type: "success",
        },
      });
    } else {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "FAILED" },
      });

      await prisma.notification.create({
        data: {
          userId: payment.booking.studentId,
          title: "Payment Rejected",
          message: `Your payment of ₹${payment.amount.toLocaleString()} could not be verified. Please contact support or try again.`,
          type: "error",
        },
      });
    }

    auditFromRequest(req, user!.userId, action === "approve" ? "PAYMENT_APPROVE" : "PAYMENT_FAIL", "payment", paymentId, { bookingId: payment.bookingId, action, amount: payment.amount });

    return apiResponse({
      success: true,
      message: `Payment ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (err) {
    console.error("Payment approval error:", err);
    return apiError("Internal server error", 500);
  }
}
