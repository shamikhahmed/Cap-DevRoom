import { ensureDbReady, prisma } from "./db";

const STANDBY = "Standing by — assign from CEO command or /issues";

/** Current task label per agent from real DB state. */
export async function getAgentCurrentTasks(): Promise<Record<string, string>> {
  await ensureDbReady();
  const out: Record<string, string> = {};

  const processing = await prisma.agentJob.findMany({
    where: { status: { in: ["PENDING", "PROCESSING"] } },
    orderBy: { createdAt: "desc" },
  });
  for (const j of processing) {
    const code = j.codename.toUpperCase();
    if (!out[code]) out[code] = j.task.slice(0, 120);
  }

  const pendingApprovals = await prisma.approval.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
  });
  for (const a of pendingApprovals) {
    const code = a.agent.toUpperCase();
    if (!out[code]) out[code] = (a.task || a.title).slice(0, 120);
  }

  const openIssues = await prisma.issue.findMany({
    where: { status: { in: ["todo", "in_progress", "in_review"] }, agent: { not: null } },
    orderBy: { updatedAt: "desc" },
  });
  for (const i of openIssues) {
    const code = (i.agent ?? "").toUpperCase();
    if (code && !out[code]) out[code] = `${i.key}: ${i.title}`.slice(0, 120);
  }

  const recentJobs = await prisma.agentJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  for (const j of recentJobs) {
    const code = j.codename.toUpperCase();
    if (!out[code]) out[code] = `Last: ${j.task.slice(0, 100)}`;
  }

  return out;
}

export function taskForAgent(tasks: Record<string, string>, codename: string): string {
  return tasks[codename.toUpperCase()] ?? STANDBY;
}
