import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";
import { uploadFile, getSignedUrlForBucket as getSignedUrl, validateFileSignature } from "@/lib/supabase-storage";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const BUCKET = "Student room booking plateform";
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, user } = requireAuth(req);
  if (error) return error;

  const ip = getClientIp(req);
  const limit = rateLimit(ip, { maxRequests: 5, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many upload requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetIn / 1000)) } }
    );
  }

  try {
    const complaint = await prisma.complaint.findUnique({ where: { id: params.id } });
    if (!complaint) return apiError("Complaint not found", 404);

    const isParticipant = complaint.complainantId === user!.userId || complaint.respondentId === user!.userId;
    if (!isParticipant && user!.role !== "ADMIN") return apiError("Forbidden", 403);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return apiError("No file provided", 400);

    if (!ALLOWED_TYPES.includes(file.type)) return apiError("Only JPEG, PNG, WebP, PDF allowed", 400);
    if (file.size > MAX_SIZE) return apiError("File must be under 5MB", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!validateFileSignature(buffer.buffer, file.type)) {
      return apiError("File content does not match its extension", 400);
    }

    const safeExt = file.type.split("/")[1].replace(/[^a-z0-9]/gi, "").toLowerCase();
    const fileName = `complaints/${params.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

    await uploadFile(BUCKET, fileName, buffer, file.type);

    const signedUrl = await getSignedUrl(BUCKET, fileName);

    await prisma.complaint.update({
      where: { id: params.id },
      data: { attachments: { push: signedUrl } },
    });

    return apiResponse({ url: signedUrl });
  } catch (err) {
    console.error("Complaint attachment error:", err);
    return apiError("Upload failed", 500);
  }
}
