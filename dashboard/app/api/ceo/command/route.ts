import { NextResponse } from "next/server";
import { runCeoCommand } from "../../../../lib/devroom/orchestrator";
import { addApproval } from "../../../../lib/devroom/store";
import { notifyCritical } from "../../../../lib/devroom/notify";
import { checkRateLimit } from "../../../../lib/devroom/rate-limit";

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "ceo/command", { limit: 12, windowMs: 60_000 });
  if (limited) return limited;
  try {
    const body = await req.json();
    const command = String(body.command || "").trim();
    const projectId = String(body.projectId || "VaultCap");
    if (!command) {
      return NextResponse.json({ error: "command required" }, { status: 400 });
    }

    const result = await runCeoCommand(command, projectId);
    if (!result.ok) {
      return NextResponse.json(result, { status: 500 });
    }

    const approvalIds: string[] = [];
    for (const a of result.assignments) {
      if (a.risk === "Medium" || a.risk === "High") {
        const apr = await addApproval({
          title: `${a.agent}: ${a.task.slice(0, 72)}`,
          description: a.reason + "\n\n" + a.task,
          agent: a.agent,
          projectId: a.project,
          risk: a.risk,
          task: a.task,
        });
        approvalIds.push(apr.id);
        if (a.risk === "High") {
          await notifyCritical(
            "Cap DevRoom: approval needed",
            `${a.agent} — ${a.task.slice(0, 120)}`,
            "approval"
          );
        }
      }
    }

    return NextResponse.json({ ...result, approvalIds });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "CEO command failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
