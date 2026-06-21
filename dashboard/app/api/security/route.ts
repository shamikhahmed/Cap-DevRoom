import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "../../../lib/devroom/rate-limit";

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(req, "security", { limit: 10, windowMs: 60_000 });
  if (rl) return rl;

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  try {
    if (projectId) {
      const { scanProjectSecurity } = await import("../../../lib/devroom/security");
      const report = await scanProjectSecurity(projectId);
      return NextResponse.json({ report });
    }

    const { portfolioSecuritySummary } = await import("../../../lib/devroom/security");
    const summary = await portfolioSecuritySummary();
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Scan failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, "security-scan", { limit: 3, windowMs: 60_000 });
  if (rl) return rl;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "scanAll");
  const projectId = body.projectId as string | undefined;

  try {
    if (action === "scan" && projectId) {
      const { scanProjectSecurity } = await import("../../../lib/devroom/security");
      const report = await scanProjectSecurity(projectId);
      return NextResponse.json({ report });
    }
    if (action === "scanAll") {
      const { scanAllSecurity, portfolioSecuritySummary } = await import("../../../lib/devroom/security");
      await scanAllSecurity();
      const summary = await portfolioSecuritySummary();
      return NextResponse.json({ ok: true, summary });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Scan failed" }, { status: 500 });
  }
}
