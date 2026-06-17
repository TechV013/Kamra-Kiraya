import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

const PUBLIC_ROUTES = ["/", "/login", "/register", "/about", "/contact", "/browse", "/admin-setup"];
const PUBLIC_API_ROUTES = ["/api/auth/", "/api/rooms", "/api/reviews", "/api/health", "/api/qr", "/api/admin/setup"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  if (pathname.startsWith("/rooms/")) return true;
  if (PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))) return true;
  return false;
}

async function verifyAuth(req: NextRequest): Promise<{ userId: string; role: string } | null> {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as string, role: payload.role as string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(pathname)) return NextResponse.next();

  const user = await verifyAuth(req);

  if (pathname.startsWith("/api/")) {
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (pathname.startsWith("/api/admin/") && pathname !== "/api/admin/setup") {
      if (user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (pathname.startsWith("/api/payments/owner") || pathname.startsWith("/api/bookings/owner") || pathname.startsWith("/api/rooms/my-rooms")) {
      if (user.role !== "OWNER" && user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/dashboard/admin") && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/dashboard/owner") && user.role !== "OWNER" && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (pathname.startsWith("/dashboard/student") && user.role !== "STUDENT" && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/admin/:path*", "/api/payments/owner", "/api/bookings/owner", "/api/rooms/my-rooms"],
};
