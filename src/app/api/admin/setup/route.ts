import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { apiError, apiResponse, validateBody } from "@/lib/api-helpers";
import { z } from "zod";

const setupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  secretKey: z.string().min(1),
});

const ADMIN_SECRET = "kamra-kiraya-admin-2024";

export async function POST(req: NextRequest) {
  try {
    const { data, errorResponse } = await validateBody(req, setupSchema);
    if (errorResponse) return errorResponse;

    if (data!.secretKey !== ADMIN_SECRET) {
      return apiError("Invalid secret key", 403);
    }

    const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (existingAdmin) {
      return apiError("Admin account already exists. Please login.", 409);
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: data!.email } });
    if (existingEmail) {
      return apiError("Email already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(data!.password, 12);

    const admin = await prisma.user.create({
      data: {
        name: data!.name,
        email: data!.email,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        isVerified: true,
      },
      select: {
        id: true, name: true, email: true, role: true,
        createdAt: true,
      },
    });

    return apiResponse({ message: "Admin account created successfully", user: admin }, 201);
  } catch (err) {
    console.error("Admin setup error:", err);
    return apiError("Internal server error", 500);
  }
}

export async function GET() {
  try {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    return apiResponse({ adminExists: adminCount > 0, adminCount });
  } catch (err) {
    return apiError("Internal server error", 500);
  }
}
