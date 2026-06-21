import { ensureDbReady, prisma } from "./db";
import { getReadiness } from "./readiness";
import { listProjects } from "./projects";

/**
 * Portfolio prioritization + investment analysis. Deterministic (no AI spend):
 * combines launch-readiness, defect load, and momentum into a single priority
 * score and an invest/ship/fix/hold/cut signal — the CTO office's call on where
 * to put the next unit of effort.
 */

export type InvestSignal = "Ship" | "Invest" | "Fix" | "Hold" | "Cut";

export interface PortfolioScoreRow {
  projectId: string;
  name: string;
  status: string;
  readiness: number;
  fails: number;
  openBugs: number;
  openIssues: number;
  momentum: number; // agent runs in last 14d
  priorityScore: number; // 0-100
  signal: InvestSignal;
  rationale: string;
}

function signalFor(r: { readiness: number; fails: number; openBugs: number; status: string; momentum: number }): {
  signal: InvestSignal;
  rationale: string;
} {
  if (r.status === "paused" || r.status === "archived") {
    return { signal: "Cut", rationale: "Paused/archived — defer or sunset." };
  }
  if (r.readiness >= 90 && r.fails === 0) {
    return { signal: "Ship", rationale: "Launch-ready — ship it." };
  }
  if (r.openBugs >= 3 || r.fails >= 4) {
    return { signal: "Fix", rationale: `${r.fails} blockers / ${r.openBugs} bugs — stabilize first.` };
  }
  if (r.readiness >= 65) {
    return { signal: "Invest", rationale: "Close to launch — invest to finish." };
  }
  if (r.readiness < 40 && r.momentum === 0) {
    return { signal: "Cut", rationale: "Low readiness, no momentum — reconsider." };
  }
  return { signal: "Hold", rationale: "Mid-stage — hold pending priorities." };
}

export async function portfolioScores(): Promise<PortfolioScoreRow[]> {
  await ensureDbReady();
  const projects = await listProjects();
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const rows: PortfolioScoreRow[] = [];
  for (const p of projects) {
    const readiness = await getReadiness(p.id);
    const openIssues = await prisma.issue.count({
      where: { projectId: p.id, status: { notIn: ["done", "canceled"] } },
    });
    const momentum = await prisma.agentJob.count({
      where: { projectId: p.id, createdAt: { gte: since } },
    });

    const base = {
      readiness: readiness.score,
      fails: readiness.counts.fail,
      openBugs: p.openBugs,
      status: p.status,
      momentum,
    };
    const { signal, rationale } = signalFor(base);

    // Priority = mostly readiness, rewarded by momentum, penalized by defects.
    const priorityScore = Math.max(
      0,
      Math.min(100, Math.round(readiness.score * 0.6 + Math.min(momentum, 10) * 2 - readiness.counts.fail * 4 - p.openBugs * 2))
    );

    rows.push({
      projectId: p.id,
      name: p.name,
      status: p.status,
      readiness: readiness.score,
      fails: readiness.counts.fail,
      openBugs: p.openBugs,
      openIssues,
      momentum,
      priorityScore,
      signal,
      rationale,
    });
  }

  return rows.sort((a, b) => b.priorityScore - a.priorityScore);
}
