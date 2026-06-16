import { NextRequest } from "next/server";
export const runtime = "nodejs";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");
    const amount = searchParams.get("amount");

    if (!paymentId || !amount) {
      return new Response("Missing paymentId or amount", { status: 400 });
    }

    const upiId = process.env.UPI_ID || "";
    const payeeName = process.env.UPI_NAME || "Kamra Kiraya";
    const note = process.env.UPI_NOTE || `Payment ${paymentId}`;

    const params = new URLSearchParams({
      pa: upiId,
      pn: payeeName,
      am: parseFloat(amount).toFixed(2),
      cu: "INR",
      tn: note,
      tr: `payment_${paymentId}`,
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
