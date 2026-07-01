import { ensureDbReady, prisma } from "./db";

export type AgentLiveStatus = "active" | "idle" | "standby";

const ACTIVE_MS = 60 * 60 * 1000;
const IDLE_MS = 24 * 60 * 60 * 1000;

export interface AgentStatusInfo {
  status: AgentLiveStatus;
  currentTask?: string;
}

export async function getAgentLiveStatuses(): Promise<Record<string, AgentLiveStatus>> {
  const full = await getAgentStatusMap();
  const out: Record<string, AgentLiveStatus> = {};
  for (const [code, info] of Object.entries(full)) {
    out[code] = info.status;
  }
  return out;
}

export async function getAgentStatusMap(): Promise<Record<string, AgentStatusInfo>> {
  await ensureDbReady();

  const statuses: Record<string, AgentStatusInfo> = {};

  const processing = await prisma.agentJob.findMany({
    where: { status: "PROCESSING" },
    orderBy: { updatedAt: "desc" },
  });
  for (const job of processing) {
    const code = job.codename.toUpperCase();
    statuses[code] = { status: "active", currentTask: job.task.slice(0, 120) };
  }

  const pending = await prisma.agentJob.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  for (const job of pending) {
    const code = job.codename.toUpperCase();
    if (!statuses[code]) {
      statuses[code] = { status: "active", currentTask: `Queued: ${job.task.slice(0, 100)}` };
    }
  }

  const since = new Date(Date.now() - IDLE_MS);
  const jobs = await prisma.agentJob.findMany({
    where: { createdAt: { gte: since }, status: { in: ["COMPLETED", "FAILED"] } },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();
  for (const job of jobs) {
    const code = job.codename.toUpperCase();
    if (statuses[code]) continue;
    const age = now - job.createdAt.getTime();
    statuses[code] = {
      status: age <= ACTIVE_MS ? "active" : "idle",
      currentTask: job.task.slice(0, 100),
    };
  }

  return statuses;
}
