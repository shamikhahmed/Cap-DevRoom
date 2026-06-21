import { NextResponse } from "next/server";
import { runAgent } from "../../../../lib/devroom/orchestrator";
import { checkRateLimit } from "../../../../lib/devroom/rate-limit";

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "agent/run", { limit: 10, windowMs: 60_000 });
  if (limited) return limited;
  try {
    const body = await req.json();
    const codename = String(body.codename || "").trim();
    const task = String(body.task || "").trim();
    const projectId = String(body.projectId || "VaultCap");

    if (!codename || !task) {
      return NextResponse.json({ error: "codename and task required" }, { status: 400 });
    }

    const result = await runAgent({ codename, task, projectId });
    const status = result.ok ? 200 : result.needsApproval ? 202 : 500;
    return NextResponse.json(result, { status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Agent run failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
