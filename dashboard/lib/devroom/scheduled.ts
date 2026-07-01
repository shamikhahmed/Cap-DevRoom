import { ensureDbReady, prisma } from "./db";
import { PORTFOLIO_APP_IDS } from "./portfolio";
import { appendActivity } from "./store";
import { scanAll, runReadinessScan } from "./readiness";

/**
 * Autonomous scheduled crews. Recurring agent runs (QA sweeps, readiness scans,
 * debt audits) the office performs on its own. Cadence → nextRunAt; a run-due
 * trigger (cron/heartbeat hitting /api/scheduled?action=run-due) executes them.
 */

export type Cadence = "hourly" | "daily" | "weekly";

function nextRun(cadence: Cadence, from = new Date()): Date {
  const d = new Date(from);
  if (cadence === "hourly") d.setHours(d.getHours() + 1);
  else if (cadence === "weekly") d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + 1);
  return d;
}

const DEFAULT_CREWS = [
  {
    name: "Weekly QA Sweep",
    codename: "SHIELD",
    task: "Run a full QA sweep on this app's sandbox: check for console errors, broken routes, missing env vars, and failing tests. Report findings as ISSUE: lines.",
    cadence: "weekly" as Cadence,
    projectId: "VaultCap",
    portfolioLoop: true,
  },
  {
    name: "Daily Readiness Scan",
    codename: "FORGE",
    task: "filesystem-readiness",
    cadence: "daily" as Cadence,
    projectId: "VaultCap",
    portfolioLoop: true,
  },
  {
    name: "Weekly Debt Audit",
    codename: "FORGE",
    task: "Audit technical debt in this sandbox: deprecated APIs, TODO comments, unused dependencies. Add ISSUE: lines for anything critical.",
    cadence: "weekly" as Cadence,
    projectId: "VaultCap",
    portfolioLoop: true,
  },
  {
    name: "Weekly Executive Briefing",
    codename: "APEX",
    task: "Generate a concise weekly briefing: what shipped, what's blocked, top 3 priorities, spend vs budget, one key risk. Keep under 200 words.",
    cadence: "weekly" as Cadence,
    projectId: "VaultCap",
    portfolioLoop: false,
  },
];

export async function seedDefaultCrews() {
  await ensureDbReady();
  const count = await prisma.scheduledRun.count();
  if (count > 0) return;
  for (const crew of DEFAULT_CREWS) {
    await prisma.scheduledRun.create({
      data: { ...crew, mode: "local", nextRunAt: nextRun(crew.cadence) },
    });
  }
}

export async function listScheduled() {
  await ensureDbReady();
  await seedDefaultCrews();
  return prisma.scheduledRun.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createScheduled(input: {
  name: string;
  codename: string;
  task: string;
  projectId?: string;
  cadence?: Cadence;
  mode?: "local" | "cloud";
  portfolioLoop?: boolean;
}) {
  await ensureDbReady();
  const cadence = (input.cadence ?? "daily") as Cadence;
  return prisma.scheduledRun.create({
    data: {
      name: input.name,
      codename: input.codename.toUpperCase(),
      task: input.task,
      projectId: input.projectId ?? "VaultCap",
      cadence,
      mode: input.mode ?? "local",
      portfolioLoop: input.portfolioLoop ?? false,
      nextRunAt: nextRun(cadence),
    },
  });
}

export async function updateScheduled(id: string, patch: Record<string, unknown>) {
  await ensureDbReady();
  return prisma.scheduledRun.update({ where: { id }, data: patch });
}

export async function deleteScheduled(id: string) {
  await ensureDbReady();
  await prisma.scheduledRun.delete({ where: { id } });
}

async function runFilesystemReadiness(): Promise<void> {
  await scanAll();
  await appendActivity({
    agent: "FORGE",
    action: "Portfolio readiness scan completed (all apps)",
    type: "info",
  });
}

/** Execute one scheduled run now (respects budget/approval gates downstream). */
export async function runScheduled(id: string) {
  await ensureDbReady();
  const s = await prisma.scheduledRun.findUnique({ where: { id } });
  if (!s) throw new Error("not found");

  const { runAgent } = await import("./orchestrator");
  const { runCloudAgent } = await import("./cloud");

  if (s.task === "filesystem-readiness") {
    if (s.portfolioLoop) {
      for (const appId of PORTFOLIO_APP_IDS) {
        await runReadinessScan(appId);
      }
      await runFilesystemReadiness();
    } else {
      await runReadinessScan(s.projectId);
    }
  } else if (s.portfolioLoop) {
    for (const appId of PORTFOLIO_APP_IDS) {
      const result =
        s.mode === "cloud"
          ? await runCloudAgent({ projectId: appId, task: s.task, codename: s.codename })
          : await runAgent({ codename: s.codename, task: s.task, projectId: appId });
      if (!result.ok && "needsApproval" in result && result.needsApproval) break;
    }
    await appendActivity({
      agent: s.codename,
      action: `Portfolio crew: ${s.name}`,
      type: "info",
    });
  } else {
    const result =
      s.mode === "cloud"
        ? await runCloudAgent({ projectId: s.projectId, task: s.task, codename: s.codename })
        : await runAgent({ codename: s.codename, task: s.task, projectId: s.projectId });
    if (!result.ok) return result;
  }

  await prisma.scheduledRun.update({
    where: { id },
    data: { lastRunAt: new Date(), nextRunAt: nextRun(s.cadence as Cadence) },
  });
  return { ok: true };
}

/** Run everything due. Call from a cron/heartbeat. Serial to respect sandbox locks. */
export async function runDue(): Promise<{ ran: string[]; skipped: number }> {
  await ensureDbReady();
  const now = new Date();
  const due = await prisma.scheduledRun.findMany({
    where: { enabled: true, OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }] },
  });
  const ran: string[] = [];
  for (const s of due) {
    try {
      await runScheduled(s.id);
      ran.push(s.id);
    } catch {
      // leave nextRunAt so it retries next tick
    }
  }
  return { ran, skipped: due.length - ran.length };
}
