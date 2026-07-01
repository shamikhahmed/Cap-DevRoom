import { NextResponse } from "next/server";
import { listServerApprovals, updateApproval } from "../../../lib/devroom/store";
import { runAgentAfterApproval } from "../../../lib/devroom/orchestrator";
import { runCloudAgent } from "../../../lib/devroom/cloud";
import { audit } from "../../../lib/devroom/audit";

function isCloudApproval(updated: { task?: string; title: string }): boolean {
  const t = updated.task || updated.title;
  return t.includes("[Cloud]") || t.toLowerCase().includes("cloud pr");
}

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

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    undefined;

  try {
    const updated = await updateApproval(id, status, "founder");

    await audit({
      action: `approval.${status}`,
      target: `${updated.agent}: ${updated.title}`,
      detail: updated.task || updated.description,
      ip,
    });

    if (status === "approved") {
      const task = updated.task || updated.description;
      if (task) {
        try {
          if (isCloudApproval(updated)) {
            const cloud = await runCloudAgent({
              codename: updated.agent,
              task: task.replace(/^\[Cloud\]\s*/i, ""),
              projectId: updated.projectId,
              createPR: true,
            });
            return NextResponse.json({
              approval: updated,
              run: { ...cloud, status: cloud.ok ? "cloud_queued" : "error" },
            });
          }

          const runResult = await runAgentAfterApproval({
            codename: updated.agent,
            task,
            projectId: updated.projectId,
            risk: updated.risk as import("../../../app/lib/data").RiskTier,
          });
          return NextResponse.json({
            approval: updated,
            run: runResult,
          });
        } catch (err) {
          console.error("[approvals] agent enqueue failed:", err);
          return NextResponse.json({
            approval: updated,
            run: { status: "error", message: err instanceof Error ? err.message : "Enqueue failed" },
          });
        }
      }
    }

    return NextResponse.json({ approval: updated });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
