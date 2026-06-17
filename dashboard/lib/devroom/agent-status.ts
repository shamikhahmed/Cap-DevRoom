import { ensureDbReady, prisma } from "./db";

export type AgentLiveStatus = "active" | "idle" | "standby";

const ACTIVE_MS = 60 * 60 * 1000;
const IDLE_MS = 24 * 60 * 60 * 1000;

export async function getAgentLiveStatuses(): Promise<Record<string, AgentLiveStatus>> {
  await ensureDbReady();
  const since = new Date(Date.now() - IDLE_MS);
  const jobs = await prisma.agentJob.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  const latestByAgent = new Map<string, Date>();
  for (const job of jobs) {
    const code = job.codename.toUpperCase();
    if (!latestByAgent.has(code)) latestByAgent.set(code, job.createdAt);
  }

  const statuses: Record<string, AgentLiveStatus> = {};
  const now = Date.now();
  for (const [code, at] of latestByAgent) {
    const age = now - at.getTime();
    statuses[code] = age <= ACTIVE_MS ? "active" : "idle";
  }
  return statuses;
}
