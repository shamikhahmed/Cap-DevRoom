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

  try {
    await ensureDbReady();
    await prisma.$queryRaw`SELECT 1`;
    const approvals = await listServerApprovals();
    pendingApprovals = approvals.filter((a) => a.status === "pending").length;
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
    version: APP_VERSION,
  });
}
