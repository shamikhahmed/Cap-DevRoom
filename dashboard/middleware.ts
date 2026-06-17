import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthorizedRequest, isDevOnlyRoute, isLocalHost, isSensitiveGet } from "./lib/devroom/auth";

const PUBLIC_GET = ["/api/health"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/api/")) return NextResponse.next();

  const host = req.headers.get("host") ?? "";

  if (isDevOnlyRoute(pathname) && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  if (req.method === "GET" || req.method === "HEAD") {
    if (PUBLIC_GET.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.next();
    }
    if (isSensitiveGet(pathname) && !isAuthorizedRequest(req)) {
      const token = process.env.DEVROOM_API_TOKEN?.trim();
      if (!token && isLocalHost(host)) return NextResponse.next();
      return NextResponse.json(
        { error: "Unauthorized — set DEVROOM_API_TOKEN and paste token in Settings" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  if (!isAuthorizedRequest(req)) {
    const token = process.env.DEVROOM_API_TOKEN?.trim();
    if (!token) {
      if (isLocalHost(host)) return NextResponse.next();
      return NextResponse.json(
        { error: "Set DEVROOM_API_TOKEN in dashboard/.env.local for LAN access" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Unauthorized — check API token in Settings" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
