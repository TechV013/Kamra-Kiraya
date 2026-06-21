import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse, validateBody } from "@/lib/api-helpers";
import { paymentSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { auditFromRequest } from "@/lib/audit";

const buildUpiPayload = (amount: number, bookingId: string, ownerUpiId: string, ownerUpiName: string) => {
  const note = process.env.UPI_NOTE || `Booking ${bookingId}`;
  const txnRef = `booking_${bookingId}`;

  const params = new URLSearchParams({
    pa: ownerUpiId,
    pn: ownerUpiName,
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
            room: { select: { id: true, title: true, images: true, city: true, ownerId: true, owner: { select: { name: true, upiId: true, upiName: true } } } },
            student: { select: { id: true, name: true, email: true } },
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

  const ip = getClientIp(req);
  const limit = rateLimit(ip, { maxRequests: 5, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many payment requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetIn / 1000)) } }
    );
  }

  try {
    const { data, errorResponse } = await validateBody(req, paymentSchema);
    if (errorResponse) return errorResponse;

    const { bookingId } = data!;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        room: {
          include: {
            owner: { select: { id: true, name: true, upiId: true, upiName: true } },
          },
        },
      },
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

    const owner = booking.room.owner;
    if (!owner.upiId) {
      return apiError("Owner has not configured payment. Please contact support.", 400);
    }

    // Get commission percent from platform config
    const config = await prisma.platformConfig.findUnique({ where: { key: "commission_percent" } });
    const commissionPercent = parseFloat(config?.value || "5");
    const platformFee = booking.totalAmount * (commissionPercent / 100);
    const ownerPayout = booking.totalAmount - platformFee;

    // Return existing payment session if one already exists
    if (booking.payment) {
      const qrPayload = buildUpiPayload(
        booking.payment.amount, booking.id,
        owner.upiId, owner.upiName || owner.name,
      );
      return apiResponse({
        paymentId: booking.payment.id,
        bookingId: booking.id,
        amount: booking.payment.amount,
        platformFee: booking.payment.platformFee,
        ownerPayout: booking.payment.ownerPayout,
        currency: booking.payment.currency,
        status: booking.payment.status,
        transactionRef: booking.payment.transactionRef,
        upiId: owner.upiId,
        payeeName: owner.upiName || owner.name,
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
        ownerUpiId: owner.upiId,
        platformFee,
        ownerPayout,
      },
    });

    const qrPayload = buildUpiPayload(
      payment.amount, bookingId,
      owner.upiId, owner.upiName || owner.name,
    );

    auditFromRequest(req, user!.userId, "PAYMENT_CREATE", "payment", payment.id, { bookingId, amount: payment.amount, platformFee, ownerPayout });

    return apiResponse({
      paymentId: payment.id,
      bookingId,
      amount: payment.amount,
      platformFee: payment.platformFee,
      ownerPayout: payment.ownerPayout,
      currency: payment.currency,
      status: payment.status,
      transactionRef,
      upiId: owner.upiId,
      payeeName: owner.upiName || owner.name,
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
