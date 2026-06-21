import { NextResponse } from "next/server";
import { runCloudAgent } from "../../../../lib/devroom/cloud";
import { getAgent } from "../../../../lib/devroom/agents";
import { addApproval } from "../../../../lib/devroom/store";
import { normalizeProjectId } from "../../../../lib/devroom/portfolio";
import { checkRateLimit } from "../../../../lib/devroom/rate-limit";
import type { RiskTier } from "../../../../app/lib/data";

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "agent/cloud", { limit: 8, windowMs: 60_000 });
  if (limited) return limited;
  try {
    const body = await req.json();
    const codename = String(body.codename || "").trim();
    const task = String(body.task || "").trim();
    const projectId = normalizeProjectId(String(body.projectId || "VaultCap"));
    const createPR = Boolean(body.createPR);

    if (!codename || !task) {
      return NextResponse.json({ error: "codename and task required" }, { status: 400 });
    }

    const def = getAgent(codename);
    if (!def) {
      return NextResponse.json({ error: `Unknown agent ${codename}` }, { status: 400 });
    }

    const risk = (body.risk as RiskTier) || def.defaultRisk;
    if (risk === "Medium" || risk === "High") {
      const apr = await addApproval({
        title: `[Cloud] ${codename}: ${task.slice(0, 72)}`,
        description: task,
        agent: codename,
        projectId,
        risk,
        task,
      });
      return NextResponse.json(
        {
          ok: true,
          needsApproval: true,
          approvalId: apr.id,
          output: `Cloud run queued for approval (${risk} risk).`,
        },
        { status: 202 }
      );
    }

    const result = await runCloudAgent({ projectId, task, codename, createPR });
    const status = result.ok ? 200 : 500;
    return NextResponse.json(result, { status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Cloud agent failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
