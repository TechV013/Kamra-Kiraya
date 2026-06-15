import { NextRequest, NextResponse } from "next/server";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { getUserFromRequest } from "./jwt";

export function requireAuth(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
    };
  }
  return { error: null, user };
}

export function requireRole(req: NextRequest, roles: string[]) {
  const { error, user } = requireAuth(req);
  if (error || !user) {
    return { error: error || NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null };
  }
  if (!roles.includes(user.role)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      user: null,
    };
  }
  return { error: null, user };
}

export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Handle Prisma database errors with user-friendly messages
 */
export function handleDatabaseError(error: unknown): NextResponse {
  console.error("Database error:", error);

  if (error instanceof PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === "P2002") {
      const field = (error.meta?.target as string[])?.[0] || "field";
      return apiError(`${field} already exists`, 409);
    }

    // Record not found
    if (error.code === "P2025") {
      return apiError("Resource not found", 404);
    }

    // Invalid relation
    if (error.code === "P2018") {
      return apiError("Invalid reference", 400);
    }

    // Foreign key constraint
    if (error.code === "P2003") {
      return apiError("Invalid relationship reference", 400);
    }
  }

  // Generic database error
  return apiError("Database operation failed", 500);
}

/**
 * Wrap async handlers with error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("API handler error:", error);
      return handleDatabaseError(error);
    }
  }) as T;
}

import { ZodSchema } from "zod";

export async function validateBody<T>(req: NextRequest, schema: ZodSchema<T>) {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const errorMsg = result.error.issues.map(err => `${err.path.join(".")}: ${err.message}`).join("; ");
      return { data: null, errorResponse: apiError(errorMsg, 400) };
    }
    return { data: result.data, errorResponse: null };
  } catch (err) {
    return { data: null, errorResponse: apiError("Invalid JSON body", 400) };
  }
}
