import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { apiError, validateBody } from "@/lib/api-helpers";
import { registerSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(ip, { maxRequests: 3, windowMs: 60_000 });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.resetIn / 1000)) } }
      );
    }

    const { data, errorResponse } = await validateBody(req, registerSchema);
    if (errorResponse) return errorResponse;

    const { name, email, password, role, phone, adminSecret } = data!;

    if (role === "ADMIN") {
      const ADMIN_SECRET = process.env.ADMIN_SECRET || "kamra-kiraya-admin-2024";
      if (!adminSecret || adminSecret !== ADMIN_SECRET) {
        return apiError("Invalid admin secret key", 403);
      }
      const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (existingAdmin) {
        return apiError("Admin account already exists. Use admin-setup page instead.", 409);
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError("Email already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role,
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
      },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({ user, token }, { status: 201 });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (err) {
    console.error("Register error:", err);
    return apiError("Internal server error", 500);
  }
}
