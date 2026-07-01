import { ensureDbReady, prisma } from "./db";
import { listProjects } from "./projects";

export type UptimeStatus = "up" | "down" | "slow";

const SLOW_MS = 3000;
const TIMEOUT_MS = 10_000;

export async function checkProjectUptime(projectId: string, liveUrl: string | null): Promise<{
  projectId: string;
  status: UptimeStatus;
  latencyMs: number | null;
  detail: string;
}> {
  if (!liveUrl?.startsWith("http")) {
    return { projectId, status: "down", latencyMs: null, detail: "No live URL configured" };
  }

  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(liveUrl, { method: "HEAD", signal: ctrl.signal, redirect: "follow" });
    clearTimeout(t);
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      return { projectId, status: "down", latencyMs, detail: `HTTP ${res.status}` };
    }
    if (latencyMs > SLOW_MS) {
      return { projectId, status: "slow", latencyMs, detail: `Slow response (${latencyMs}ms)` };
    }
    return { projectId, status: "up", latencyMs, detail: "OK" };
  } catch (e) {
    return {
      projectId,
      status: "down",
      latencyMs: Date.now() - start,
      detail: e instanceof Error ? e.message : "Unreachable",
    };
  }
}

export async function runPortfolioUptimeChecks(): Promise<
  Array<{ projectId: string; status: UptimeStatus; latencyMs: number | null; detail: string }>
> {
  await ensureDbReady();
  const projects = await listProjects();
  const results = [];

  for (const p of projects) {
    if (!p.liveUrl?.includes("shamikhahmed.github.io") && !p.liveUrl?.startsWith("http")) continue;
    const r = await checkProjectUptime(p.id, p.liveUrl);
    results.push(r);
    await prisma.healthCheck.create({
      data: {
        projectId: r.projectId,
        status: r.status,
        latencyMs: r.latencyMs ?? undefined,
        detail: r.detail,
      },
    });

    if (r.status === "down") {
      const existing = await prisma.issue.findFirst({
        where: {
          projectId: p.id,
          type: "bug",
          status: { notIn: ["done", "canceled"] },
          title: { contains: "Site down" },
        },
      });
      if (!existing) {
        const { createIssue } = await import("./issues");
        await createIssue({
          title: `Site down: ${p.name}`,
          body: `${p.liveUrl} — ${r.detail}`,
          projectId: p.id,
          type: "bug",
          priority: "urgent",
          agent: "VAULT",
          status: "todo",
        });
      }
    }
  }

  const cutoff = new Date(Date.now() - 7 * 864e5);
  await prisma.healthCheck.deleteMany({ where: { checkedAt: { lt: cutoff } } });

  return results;
}

export async function latestUptimeSummary(): Promise<
  Record<string, { status: UptimeStatus; latencyMs: number | null; checkedAt: string }>
> {
  await ensureDbReady();
  const projects = await listProjects();
  const out: Record<string, { status: UptimeStatus; latencyMs: number | null; checkedAt: string }> = {};

  for (const p of projects) {
    const row = await prisma.healthCheck.findFirst({
      where: { projectId: p.id },
      orderBy: { checkedAt: "desc" },
    });
    if (row) {
      out[p.id] = {
        status: row.status as UptimeStatus,
        latencyMs: row.latencyMs,
        checkedAt: row.checkedAt.toISOString(),
      };
    }
  }
  return out;
}
