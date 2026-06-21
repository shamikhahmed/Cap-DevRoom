import type { NextRequest } from "next/server";

const SENSITIVE_GET_PREFIXES = [
  "/api/diagnostics",
  "/api/network",
  "/api/jobs",
  "/api/approvals",
  "/api/memory",
  "/api/activity",
  "/api/tasks",
  "/api/priorities",
  "/api/briefings",
  "/api/agents/",
  "/api/scan/",
  "/api/setup/",
  "/api/handoff",
  "/api/projects",
  "/api/issues",
  "/api/budget",
  "/api/audit",
  "/api/readiness",
  "/api/priority",
  "/api/scheduled",
  "/api/exec-report",
  "/api/worker",
];

export function isLocalHost(host: string): boolean {
  return (
    host.startsWith("localhost:") ||
    host.startsWith("127.0.0.1:") ||
    host.endsWith(".local")
  );
}

export function readProvidedToken(req: NextRequest): string {
  return (
    req.headers.get("x-devroom-token") ??
    req.cookies.get("devroom_token")?.value ??
    ""
  );
}

export function isAuthorizedRequest(req: NextRequest): boolean {
  const token = process.env.DEVROOM_API_TOKEN?.trim();
  const host = req.headers.get("host") ?? "";

  if (!token) {
    return isLocalHost(host);
  }

  return readProvidedToken(req) === token;
}

export function isSensitiveGet(pathname: string): boolean {
  if (pathname === "/api/health") return false;
  return SENSITIVE_GET_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p)
  );
}

export function isDevOnlyRoute(pathname: string): boolean {
  return pathname === "/api/approvals/reset";
}
