import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiResponse } from "@/lib/api-helpers";
import { uploadFile, deleteFile, validateFileSignature } from "@/lib/supabase-storage";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const AVATAR_BUCKET = "Student room booking plateform";
const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error || !user) return error || apiError("Unauthorized", 401);

  const ip = getClientIp(req);
  const limit = rateLimit(ip, { maxRequests: 5, windowMs: 60_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many upload requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetIn / 1000)) } }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;
    if (!file) return apiError("No file provided", 400);

    if (!ALLOWED_TYPES.includes(file.type)) return apiError("Only JPEG, PNG, WebP allowed", 400);
    if (file.size > MAX_SIZE) return apiError("File must be under 2MB", 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!validateFileSignature(buffer.buffer, file.type)) {
      return apiError("File content does not match its extension", 400);
    }

    const safeExt = file.type.split("/")[1].replace(/[^a-z0-9]/gi, "").toLowerCase();
    const fileName = `avatars/${user.userId}.${safeExt}`;

    const current = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { avatar: true, avatarPath: true },
    });
    if (current?.avatarPath) {
      await deleteFile(AVATAR_BUCKET, current.avatarPath).catch(() => {});
    }

    await uploadFile(AVATAR_BUCKET, fileName, buffer, file.type);

    // Store a stable, never-expiring app URL; the route resolves it to a fresh
    // signed Supabase URL on demand. The version param busts the image cache.
    const avatarUrl = `/api/users/avatar/${user.userId}?v=${Date.now()}`;
    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: { avatarPath: fileName, avatar: avatarUrl },
      select: { id: true, avatar: true, name: true, email: true },
    });

    return apiResponse({ user: updated });
  } catch (err) {
    console.error("Avatar upload error:", err);
    return apiError("Upload failed", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (error || !user) return error || apiError("Unauthorized", 401);

  try {
    const current = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { avatar: true, avatarPath: true },
    });
    if (!current?.avatarPath && !current?.avatar) return apiError("No avatar to delete", 400);

    if (current.avatarPath) {
      await deleteFile(AVATAR_BUCKET, current.avatarPath).catch(() => {});
    }

    await prisma.user.update({
      where: { id: user.userId },
      data: { avatar: null, avatarPath: null },
    });

    return apiResponse({ message: "Avatar removed" });
  } catch (err) {
    console.error("Avatar delete error:", err);
    return apiError("Delete failed", 500);
  }
}
