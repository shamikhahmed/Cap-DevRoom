import { NextResponse } from "next/server";
import { ensureDbReady, prisma } from "../../../lib/devroom/db";
import { normalizeProjectId } from "../../../lib/devroom/portfolio";
import { addApproval } from "../../../lib/devroom/store";
import { notifyCritical } from "../../../lib/devroom/notify";
import { createIssue } from "../../../lib/devroom/issues";

/** Inbound handoff from Cap · Markroom (or other Cap offices). */
export async function GET() {
  await ensureDbReady();
  const pending = await prisma.handoff.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ handoffs: pending });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const source = String(body.source || "markroom");
    const codename = String(body.codename || "FORGE").trim().toUpperCase();
    const task = String(body.task || "").trim();
    const projectId = normalizeProjectId(String(body.projectId || "VaultCap"));
    const risk = String(body.risk || "Medium") as "Low" | "Medium" | "High";
    const metadata = body.metadata ? JSON.stringify(body.metadata) : null;

    if (!task) {
      return NextResponse.json({ error: "task required" }, { status: 400 });
    }

    await ensureDbReady();
    const handoff = await prisma.handoff.create({
      data: { source, codename, task, projectId, risk, metadata, status: "pending" },
    });

    const issue = await createIssue({
      title: `[${source}] ${task.slice(0, 120)}`,
      body: task,
      projectId,
      agent: codename,
      type: "task",
      priority: risk === "High" ? "high" : "medium",
      status: "todo",
    });

    await prisma.handoff.update({
      where: { id: handoff.id },
      data: { issueId: issue.id, status: "in_progress" },
    });

    const apr = await addApproval({
      title: `[${source}] ${codename}: ${task.slice(0, 72)}`,
      description: task,
      agent: codename,
      projectId,
      risk,
      task,
    });

    if (risk === "High") {
      await notifyCritical(
        "Cap DevRoom: Markroom handoff",
        `${codename} — ${task.slice(0, 120)}`,
        "approval"
      );
    }

    return NextResponse.json({ ok: true, handoff, approvalId: apr.id, issueId: issue.id, issueKey: issue.key }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Handoff failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const id = String(body.id || "");
  const status = String(body.status || "accepted");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await ensureDbReady();
  const row = await prisma.handoff.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json({ handoff: row });
}
