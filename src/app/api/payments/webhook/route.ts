import { NextRequest } from "next/server";
import { apiError } from "@/lib/api-helpers";

// POST /api/payments/webhook - QR payment does not support webhooks
export async function POST(req: NextRequest) {
  return apiError("QR payment gateway does not support webhooks", 404);
}