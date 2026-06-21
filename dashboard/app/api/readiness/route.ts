import { NextResponse } from "next/server";
import {
  approveCheck,
  getReadiness,
  portfolioReadiness,
  runReadinessScan,
  scanAll,
} from "../../../lib/devroom/readiness";
import { audit } from "../../../lib/devroom/audit";

export async function GET(req: Request) {
  const projectId = new URL(req.url).searchParams.get("projectId");
  if (projectId) {
    return NextResponse.json({ report: await getReadiness(projectId) });
  }
  return NextResponse.json({ portfolio: await portfolioReadiness() });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "scan");

  if (action === "scanAll") {
    return NextResponse.json({ portfolio: await scanAll() });
  }

  const projectId = String(body.projectId || "");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  if (action === "scan") {
    const report = await runReadinessScan(projectId);
    return NextResponse.json({ report });
  }

  if (action === "approve" || action === "unapprove") {
    const checkId = String(body.checkId || "");
    if (!checkId) return NextResponse.json({ error: "checkId required" }, { status: 400 });
    const approve = action === "approve";
    const report = await approveCheck(projectId, checkId, "founder", approve);
    await audit({ action: `readiness.${action}`, target: `${projectId}:${checkId}` });
    return NextResponse.json({ report });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
