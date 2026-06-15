import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/api-helpers";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(ip, { maxRequests: 3, windowMs: 60_000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetIn / 1000)) } }
      );
    }

    const { email } = await req.json();
    if (!email) {
      return apiError("Email is required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return apiResponse({ message: "If that email exists, a reset link has been sent." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60_000),
      },
    });

    const sent = await sendPasswordResetEmail(email, rawToken);
    if (!sent) {
      return apiError("Failed to send email. Try again later.", 500);
    }

    return apiResponse({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();
    if (!token || !newPassword) {
      return apiError("Token and new password are required");
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      return apiError("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return apiError("Invalid or expired reset token", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    return apiResponse({ message: "Password has been reset successfully. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    return apiError("Internal server error", 500);
  }
}
