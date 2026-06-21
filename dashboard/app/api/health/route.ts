import { APP_VERSION } from "@cap/devroom-shared";
import { NextResponse } from "next/server";
import { listSandboxes } from "../../../lib/devroom/sandboxes";
import { sandboxSyncStatus } from "../../../lib/devroom/sandbox-sync";
import { listServerApprovals } from "../../../lib/devroom/store";
import { ensureDbReady, prisma } from "../../../lib/devroom/db";

export async function GET() {
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
  });
}
