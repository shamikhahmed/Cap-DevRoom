import { ensureDbReady, prisma } from "./db";

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface AgentJobRecord {
  id: string;
  codename: string;
  task: string;
  projectId: string;
  risk: string;
  status: JobStatus;
  output?: string;
  error?: string;
  tokensUsed: number;
  costUsd: number;
  createdAt: string;
  updatedAt: string;
}

function toRecord(row: {
  id: string;
  codename: string;
  task: string;
  projectId: string;
  risk: string;
  status: string;
  output: string | null;
  error: string | null;
  tokensUsed: number;
  costUsd: number;
  createdAt: Date;
  updatedAt: Date;
}): AgentJobRecord {
  return {
    id: row.id,
    codename: row.codename,
    task: row.task,
    projectId: row.projectId,
    risk: row.risk,
    status: row.status as JobStatus,
    output: row.output ?? undefined,
    error: row.error ?? undefined,
    tokensUsed: row.tokensUsed,
    costUsd: row.costUsd,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createJob(input: {
  codename: string;
  task: string;
  projectId: string;
  risk: string;
}): Promise<AgentJobRecord> {
  await ensureDbReady();
  const row = await prisma.agentJob.create({
    data: {
      codename: input.codename,
      task: input.task,
      projectId: input.projectId,
      risk: input.risk,
      status: "PENDING",
    },
  });
  return toRecord(row);
}

export async function setJobStatus(
  id: string,
  status: JobStatus,
  extra?: { output?: string; error?: string; tokensUsed?: number; costUsd?: number; testResult?: string }
) {
  await ensureDbReady();
  const row = await prisma.agentJob.update({
    where: { id },
    data: {
      status,
      output: extra?.output,
      error: extra?.error,
      testResult: extra?.testResult,
      ...(extra?.tokensUsed != null ? { tokensUsed: extra.tokensUsed } : {}),
      ...(extra?.costUsd != null ? { costUsd: extra.costUsd } : {}),
    },
  });
  return toRecord(row);
}

/** Self-heal orphaned runs: a job stuck PROCESSING past the lock TTL means the
 * process died mid-run. Flip it to FAILED so the UI doesn't spin forever. */
export async function reapStaleJobs(maxAgeMs = 20 * 60_000): Promise<number> {
  await ensureDbReady();
  const cutoff = new Date(Date.now() - maxAgeMs);
  const res = await prisma.agentJob.updateMany({
    where: { status: "PROCESSING", updatedAt: { lt: cutoff } },
    data: { status: "FAILED", error: "Run timed out or process restarted (orphaned)." },
  });
  return res.count;
}

export async function listJobs(limit = 50): Promise<AgentJobRecord[]> {
  await ensureDbReady();
  await reapStaleJobs();
  // Resume draining after a restart (UI polls this) — lazy import avoids a cycle.
  try {
    const { ensureWorker } = await import("./worker");
    ensureWorker();
  } catch {
    /* worker optional */
  }
  const rows = await prisma.agentJob.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toRecord);
}

export async function getJob(id: string): Promise<AgentJobRecord | null> {
  await ensureDbReady();
  const row = await prisma.agentJob.findUnique({ where: { id } });
  return row ? toRecord(row) : null;
}

export async function recentJobsByAgent(codename: string, limit = 5) {
  await ensureDbReady();
  const rows = await prisma.agentJob.findMany({
    where: { codename: codename.toUpperCase() },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toRecord);
}

export async function aggregateSalaryByAgent(): Promise<
  Record<string, { tokens: number; cost: number; runs: number; lastRunAt: string | null }>
> {
  await ensureDbReady();
  const groups = await prisma.agentJob.groupBy({
    by: ["codename"],
    _sum: { tokensUsed: true, costUsd: true },
    _count: { _all: true },
    _max: { createdAt: true },
  });

  const out: Record<string, { tokens: number; cost: number; runs: number; lastRunAt: string | null }> = {};
  for (const g of groups) {
    out[g.codename] = {
      tokens: g._sum.tokensUsed ?? 0,
      cost: parseFloat((g._sum.costUsd ?? 0).toFixed(4)),
      runs: g._count._all,
      lastRunAt: g._max.createdAt?.toISOString() ?? null,
    };
  }
  return out;
}
