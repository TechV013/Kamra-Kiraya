import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { apiError, validateBody } from "@/lib/api-helpers";
import { loginSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { auditFromRequest } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(ip, { maxRequests: 5, windowMs: 60_000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetIn / 1000)) } }
      );
    }

    const { data, errorResponse } = await validateBody(req, loginSchema);
    if (errorResponse) return errorResponse;

    const { email, password } = data!;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return apiError("Invalid credentials", 401);
    }

    if (!user.isActive) {
      return apiError("Account is disabled", 403);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Account temporarily locked. Try again later." },
        { status: 423, headers: { "Retry-After": String(remaining) } }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { increment: 1 } },
      });
      const updated = await prisma.user.findUnique({ where: { id: user.id } });
      if (updated && updated.failedLoginAttempts >= 5) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lockedUntil: new Date(Date.now() + 15 * 60_000) },
        });
        return NextResponse.json(
          { error: "Account temporarily locked due to too many failed attempts. Try again in 15 minutes." },
          { status: 423 }
        );
      }
      return apiError("Invalid credentials", 401);
    }

    if (user.failedLoginAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };

    auditFromRequest(req, user.id, "USER_LOGIN", "user", user.id);

    const response = NextResponse.json({ user: userData, token });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (err) {
    console.error("Login error:", err);
    return apiError("Internal server error", 500);
  }
}
