import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, apiResponse } from "@/lib/api-helpers";

// POST /api/auth/forgot-password - send reset link
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return apiError("Email is required");
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return apiResponse({ message: "If email exists, reset link has been sent" });
    }

    // TODO: Generate reset token and send email
    // For now, just return success message
    // In production, integrate with email service and store reset token

    return apiResponse({ message: "Reset link has been sent to your email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    return apiError("Internal server error", 500);
  }
}

// POST /api/auth/reset-password - reset password with token
export async function PATCH(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return apiError("Token and new password are required");
    }

    if (newPassword.length < 8) {
      return apiError("Password must be at least 8 characters");
    }

    // TODO: Verify reset token
    // For now, this is a placeholder
    // In production, verify token from database/cache

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // TODO: Update user password based on token
    // For now, just return success
    return apiResponse({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    return apiError("Internal server error", 500);
  }
}
