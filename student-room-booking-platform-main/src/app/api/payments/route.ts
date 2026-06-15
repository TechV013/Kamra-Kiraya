import crypto from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse, validateBody } from "@/lib/api-helpers";
import { paymentSchema } from "@/lib/validations";

const isQrPaymentConfigured = () => {
  return (
    !!process.env.UPI_ID &&
    !!process.env.UPI_NAME &&
    !process.env.UPI_ID.includes("placeholder") &&
    !process.env.UPI_NAME.includes("placeholder")
  );
};

const buildUpiPayload = (amount: number, bookingId: string) => {
  const upiId = process.env.UPI_ID!;
  const payeeName = process.env.UPI_NAME!;
  const note = process.env.UPI_NOTE || `Orchids booking ${bookingId}`;
  const txnRef = `booking_${bookingId}`;

  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
    tr: txnRef,
  });

  return `upi://pay?${params.toString()}`;
};

// GET /api/payments - user's payments
export async function GET(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    const payments = await prisma.payment.findMany({
      where: {
        booking: { studentId: user!.userId },
      },
      include: {
        booking: {
          include: {
            room: { select: { id: true, title: true, images: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiResponse(payments);
  } catch (err) {
    console.error("Get payments error:", err);
    return apiError("Internal server error", 500);
  }
}

// POST /api/payments - create payment intent
export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  try {
    if (!isQrPaymentConfigured()) {
      return apiError("QR payment gateway is not configured. Please contact support.", 503);
    }

    const { data, errorResponse } = await validateBody(req, paymentSchema);
    if (errorResponse) return errorResponse;

    const { bookingId } = data!;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, room: true },
    });

    if (!booking) {
      return apiError("Booking not found", 404);
    }

    if (booking.studentId !== user!.userId && user!.role !== "ADMIN") {
      return apiError("Forbidden", 403);
    }

    if (booking.status !== "CONFIRMED") {
      return apiError("Booking is not approved for payment");
    }

    // Return existing payment session if one already exists
    if (booking.payment) {
      const qrPayload = buildUpiPayload(booking.payment.amount, booking.id);
      return apiResponse({
        paymentId: booking.payment.id,
        bookingId: booking.id,
        amount: booking.payment.amount,
        currency: booking.payment.currency,
        status: booking.payment.status,
        transactionRef: booking.payment.transactionRef,
        upiId: process.env.UPI_ID,
        payeeName: process.env.UPI_NAME,
        note: process.env.UPI_NOTE || `Orchids booking ${booking.id}`,
        qrPayload,
      });
    }

    const transactionRef = crypto.randomUUID();
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount: booking.totalAmount,
        currency: "INR",
        status: "PENDING",
        transactionRef,
      },
    });

    const qrPayload = buildUpiPayload(payment.amount, bookingId);

    return apiResponse({
      paymentId: payment.id,
      bookingId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      transactionRef,
      upiId: process.env.UPI_ID,
      payeeName: process.env.UPI_NAME,
      note: process.env.UPI_NOTE || `Orchids booking ${bookingId}`,
      qrPayload,
    }, 201);
  } catch (err: any) {
    console.error("Create payment error:", err);
    console.error("Error details:", err?.message || err);
    if (err?.code === "P2002") {
      return apiError("A payment for this booking already exists", 409);
    }
    return apiError(err?.message || "Internal server error", 500);
  }
}
