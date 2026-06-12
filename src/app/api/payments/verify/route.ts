import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse, validateBody } from "@/lib/api-helpers";
import { paymentVerifySchema } from "@/lib/validations";

const UPI_TXN_REGEX = /^[A-Za-z0-9\-_.]{8,35}$/;

function validateUpiTransactionId(ref: string): string | null {
  if (!UPI_TXN_REGEX.test(ref)) {
    return "Transaction ID must be 8-35 characters (letters, numbers, hyphens, underscores, dots)";
  }
  const fakePatterns = [
    /^test/i, /^fake/i, /^dummy/i, /^sample/i, /^example/i,
    /^123456/, /^abcdef/i, /^000000/, /^111111/,
    /(.)\1{5,}/,
    /^[a-z]{6}$/i,
  ];
  for (const pattern of fakePatterns) {
    if (pattern.test(ref)) return "Transaction ID appears to be invalid";
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { data, errorResponse } = await validateBody(req, paymentVerifySchema);
    if (errorResponse) return errorResponse;

    const { paymentId, bookingId, paymentReference } = data!;

    const validationError = validateUpiTransactionId(paymentReference);
    if (validationError) {
      return apiError(validationError, 400);
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment) {
      return apiError("Payment not found", 404);
    }

    if (payment.booking.studentId !== user!.userId) {
      return apiError("Unauthorized", 403);
    }

    if (payment.booking.id !== bookingId) {
      return apiError("Payment does not belong to the booking", 400);
    }

    if (paymentReference === payment.transactionRef) {
      return apiError("Transaction reference cannot be the same as the generated reference", 400);
    }

    if (payment.status !== "PENDING") {
      return apiError("Payment cannot be verified in its current state", 400);
    }

    if (payment.amount <= 0) {
      return apiError("Invalid payment amount", 400);
    }

    const existingReference = await prisma.payment.findFirst({
      where: {
        paymentReference,
        status: { in: ["SUCCEEDED", "PENDING", "VERIFICATION_PENDING"] },
      },
    });

    if (existingReference && existingReference.id !== paymentId) {
      return apiError("This transaction reference has already been used", 400);
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "VERIFICATION_PENDING",
        paymentReference,
      },
    });

    await prisma.notification.create({
      data: {
        userId: payment.booking.studentId,
        title: "Payment Submitted",
        message: `Your payment of ₹${payment.amount.toLocaleString()} is pending verification. You will be notified once verified.`,
        type: "info",
      },
    });

    console.log(`Payment submitted for verification: Payment ${paymentId} for booking ${bookingId} with transaction ${paymentReference}`);

    return apiResponse({
      success: true,
      message: "Payment submitted for verification. Your booking will be confirmed once the owner verifies your payment.",
      status: "VERIFICATION_PENDING",
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    return apiError("Internal server error", 500);
  }
}
