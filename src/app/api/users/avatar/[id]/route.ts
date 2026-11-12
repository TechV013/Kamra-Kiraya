import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSignedUrlForBucket } from "@/lib/supabase-storage";

const AVATAR_BUCKET = "Student room booking plateform";

/**
 * GET /api/users/avatar/[id]
 *
 * Redirects to a short-lived signed Supabase URL. The URL stored on the user
 * record is this stable route, so avatars no longer break when the signed URL
 * expires.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { avatarPath: true, avatar: true },
  });

  if (!user) return new NextResponse("Not found", { status: 404 });

  // Legacy rows may still hold the raw signed URL from before avatarPath existed.
  if (!user.avatarPath) {
    if (user.avatar?.startsWith("http")) {
      return NextResponse.redirect(user.avatar, 307);
    }
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const signedUrl = await getSignedUrlForBucket(AVATAR_BUCKET, user.avatarPath);
    return NextResponse.redirect(signedUrl, {
      status: 307,
      headers: {
        // Cache just under the 1 hour signature lifetime.
        "Cache-Control": "private, max-age=3000",
      },
    });
  } catch (err) {
    console.error("Avatar sign error:", err);
    return new NextResponse("Avatar unavailable", { status: 502 });
  }
}
