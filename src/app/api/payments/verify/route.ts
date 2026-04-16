import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";

// POST /api/payments/verify - manually verify QR payment
export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const { paymentId, bookingId, paymentReference } = await req.json();

    if (!paymentId || !bookingId || !paymentReference) {
      return apiError("Payment ID, booking ID, and transaction reference are required");
    }

    // Validate UPI transaction reference format
    const upiTxnRegex = /^[A-Za-z0-9]{8,35}$/;
    if (!upiTxnRegex.test(paymentReference)) {
      return apiError("Invalid transaction reference format. UPI transaction IDs are typically 8-35 alphanumeric characters", 400);
    }

    // Additional validation: should not contain spaces or special characters except allowed ones
    if (paymentReference.includes(' ') || /[^A-Za-z0-9\-_.]/.test(paymentReference)) {
      return apiError("Transaction reference contains invalid characters", 400);
    }

    // Check for obviously fake/test transaction IDs
    const fakePatterns = [
      /^test/i,
      /^fake/i,
      /^dummy/i,
      /^123456/,
      /^abcdef/i,
      /(.)\1{5,}/  // repeated characters
    ];

    if (fakePatterns.some(pattern => pattern.test(paymentReference))) {
      return apiError("Transaction reference appears to be invalid or test data", 400);
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
        status: { in: ["SUCCEEDED", "PENDING"] },
      },
    });

    if (existingReference && existingReference.id !== paymentId) {
      console.log(`Payment verification failed: Transaction reference ${paymentReference} already used for payment ${existingReference.id}`);
      return apiError("This transaction reference has already been used or is pending verification", 400);
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "SUCCEEDED",
        paymentReference,
        razorpayPaymentId: paymentReference,
      },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "COMPLETED" },
    });

    console.log(`Payment verified successfully: Payment ${paymentId} for booking ${bookingId} with transaction ${paymentReference}`);

    return apiResponse({ success: true, message: "Payment verified and booking completed successfully" });
  } catch (err) {
    console.error("Payment verification error:", err);
    return apiError("Internal server error", 500);
  }
}