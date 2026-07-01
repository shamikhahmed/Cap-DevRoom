import { APP_VERSION } from "@cap/devroom-shared";
import { NextResponse } from "next/server";
import { listSandboxes } from "../../../lib/devroom/sandboxes";
import { sandboxSyncStatus } from "../../../lib/devroom/sandbox-sync";
import { listServerApprovals } from "../../../lib/devroom/store";
import { ensureDbReady, prisma } from "../../../lib/devroom/db";
import { latestUptimeSummary } from "../../../lib/devroom/uptime";
import { countUnpromotedFiles } from "../../../lib/devroom/promote";
import { PORTFOLIO_APP_IDS } from "../../../lib/devroom/portfolio";
import { ensureHeartbeat } from "../../../lib/devroom/heartbeat";

export async function GET() {
  ensureHeartbeat();
  const hasKey = Boolean(process.env.CURSOR_API_KEY?.trim());
  const sandboxes = listSandboxes();
  let database: "ok" | "unavailable" = "ok";
  let pendingApprovals = 0;

  let openBugs = 0;
  let activeProjects = 0;
  let totalProjects = 0;

  try {
    await ensureDbReady();
    await prisma.$queryRaw`SELECT 1`;
    const approvals = await listServerApprovals();
    pendingApprovals = approvals.filter((a) => a.status === "pending").length;

    const [bugCount, projActive, projTotal] = await Promise.all([
      prisma.issue.count({ where: { type: "bug", status: { notIn: ["done", "canceled"] } } }),
      prisma.project.count({ where: { status: "active" } }),
      prisma.project.count(),
    ]);
    openBugs = bugCount;
    activeProjects = projActive;
    totalProjects = projTotal;
  } catch {
    database = "unavailable";
  }

  const sync = sandboxSyncStatus();

  let uptime: Record<string, unknown> = {};
  let unpromotedTotal = 0;
  if (database === "ok") {
    try {
      uptime = await latestUptimeSummary();
      for (const id of PORTFOLIO_APP_IDS) {
        unpromotedTotal += countUnpromotedFiles(id);
      }
    } catch {
      /* optional */
    }
  }

  let lastActivityAt: string | null = null;
  if (database === "ok") {
    const last = await prisma.activityLog.findFirst({ orderBy: { createdAt: "desc" } });
    lastActivityAt = last?.createdAt.toISOString() ?? null;
  }

  return NextResponse.json({
    ok: database === "ok",
    cursorApi: hasKey ? "configured" : "missing",
    database,
    sandboxes,
    sandboxSync: sync,
    pendingApprovals,
    openBugs,
    activeProjects,
    totalProjects,
    version: APP_VERSION,
    uptime,
    unpromotedTotal,
    lastActivityAt,
    heartbeat: process.env.DEVROOM_HEARTBEAT === "1",
  });
}
