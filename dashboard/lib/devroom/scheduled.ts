import { ensureDbReady, prisma } from "./db";

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

export async function listScheduled() {
  await ensureDbReady();
  return prisma.scheduledRun.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createScheduled(input: {
  name: string;
  codename: string;
  task: string;
  projectId?: string;
  cadence?: Cadence;
  mode?: "local" | "cloud";
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

/** Execute one scheduled run now (respects budget/approval gates downstream). */
export async function runScheduled(id: string) {
  await ensureDbReady();
  const s = await prisma.scheduledRun.findUnique({ where: { id } });
  if (!s) throw new Error("not found");

  const { runAgent } = await import("./orchestrator");
  const { runCloudAgent } = await import("./cloud");

  const result =
    s.mode === "cloud"
      ? await runCloudAgent({ projectId: s.projectId, task: s.task, codename: s.codename })
      : await runAgent({ codename: s.codename, task: s.task, projectId: s.projectId });

  await prisma.scheduledRun.update({
    where: { id },
    data: { lastRunAt: new Date(), nextRunAt: nextRun(s.cadence as Cadence) },
  });
  return result;
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
