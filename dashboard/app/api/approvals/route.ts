import { NextResponse } from "next/server";
import { listServerApprovals, updateApproval } from "../../../lib/devroom/store";
import { runAgentAfterApproval } from "../../../lib/devroom/orchestrator";

export async function GET() {
  const approvals = await listServerApprovals();
  return NextResponse.json({ approvals });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const id = String(body.id || "");
  const status = body.status as "approved" | "rejected";
  if (!id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  try {
    const updated = await updateApproval(id, status);

    if (status === "approved") {
      const task = updated.task || updated.description;
      if (task) {
        void runAgentAfterApproval({
          codename: updated.agent,
          task,
          projectId: updated.projectId,
          risk: updated.risk as import("../../../app/lib/data").RiskTier,
        }).catch((err) => {
          console.error("[approvals] background agent run failed:", err);
        });
        return NextResponse.json({
          approval: updated,
          run: { status: "started", message: `${updated.agent} is working in the background. Watch progress on Home.` },
        });
      }
    }

    return NextResponse.json({ approval: updated });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
