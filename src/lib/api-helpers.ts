import { NextRequest, NextResponse } from "next/server";
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
