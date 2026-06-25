import { NextRequest } from "next/server";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");
    const amount = searchParams.get("amount");
    const ownerUpiId = searchParams.get("upiId");
    const payeeName = searchParams.get("payeeName") || "Kamra Kiraya";

    if (!ownerUpiId && !process.env.UPI_ID) {
      return new Response("Missing upiId — no UPI ID configured", { status: 400 });
    }
    if (!amount) {
      return new Response("Missing amount", { status: 400 });
    }

    const upiId = ownerUpiId || process.env.UPI_ID!;
    const note = process.env.UPI_NOTE || `Payment ${paymentId || "preview"}`;
    const txnRef = paymentId ? `payment_${paymentId}` : `preview_${Date.now()}`;

    const params = new URLSearchParams({
      pa: upiId,
      pn: payeeName,
      am: parseFloat(amount).toFixed(2),
      cu: "INR",
      tn: note,
      tr: txnRef,
    });

    const upiPayload = `upi://pay?${params.toString()}`;

    const pngBuffer = await QRCode.toBuffer(upiPayload, {
      width: 300,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });

    return new Response(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Failed to generate QR code", { status: 500 });
  }
}
