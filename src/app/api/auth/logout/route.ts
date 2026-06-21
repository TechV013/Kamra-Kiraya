import { NextRequest, NextResponse } from "next/server";
import { auditFromRequest } from "@/lib/audit";
import { requireAuth } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const { error, user } = requireAuth(req);
  if (!error && user) {
    auditFromRequest(req, user.userId, "USER_LOGOUT", "user", user.userId);
  }
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.set("token", "", { maxAge: 0 });
  return response;
}
