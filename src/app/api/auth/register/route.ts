import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { apiError } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role = "STUDENT", phone } = await req.json();

    if (!name || !email || !password) {
      return apiError("Name, email, and password are required");
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError("Email already registered", 409);
    }

    const validRoles = ["STUDENT", "OWNER"];
    const userRole = validRoles.includes(role) ? role : "STUDENT";

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
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
