import { Agent } from "@cursor/sdk";
import { DEVROOM_ROOT } from "./sandboxes";
import { portfolioScores } from "./priority";
import { budgetStatus, assertWithinBudget, recordSpend } from "./budget";
import { ensureDbReady, prisma } from "./db";

/**
 * Board-level executive report. Synthesizes launch-readiness, prioritization,
 * defect load, and AI spend into a single CTO-office briefing for the founder.
 */

export interface ExecReportData {
  generatedAt: string;
  budget: Awaited<ReturnType<typeof budgetStatus>>;
  scores: Awaited<ReturnType<typeof portfolioScores>>;
  openApprovals: number;
  openIssues: number;
  shipReady: string[];
  needsFixing: string[];
}

export async function execReportData(): Promise<ExecReportData> {
  await ensureDbReady();
  const scores = await portfolioScores();
  const budget = await budgetStatus();
  const openApprovals = await prisma.approval.count({ where: { status: "pending" } });
  const openIssues = await prisma.issue.count({ where: { status: { notIn: ["done", "canceled"] } } });
  return {
    generatedAt: new Date().toISOString(),
    budget,
    scores,
    openApprovals,
    openIssues,
    shipReady: scores.filter((s) => s.signal === "Ship").map((s) => s.name),
    needsFixing: scores.filter((s) => s.signal === "Fix").map((s) => s.name),
  };
}

function apiKey(): string {
  const key = process.env.CURSOR_API_KEY?.trim();
  if (!key) throw new Error("CURSOR_API_KEY missing — add to dashboard/.env.local");
  return key;
}

/** AI-written narrative report. Falls back to a deterministic summary if no key. */
export async function generateExecReport(): Promise<{ data: ExecReportData; narrative: string; ai: boolean }> {
  const data = await execReportData();

  if (!process.env.CURSOR_API_KEY?.trim()) {
    return { data, narrative: deterministicNarrative(data), ai: false };
  }

  await assertWithinBudget();
  const prompt = `You are APEX, the CTO/CEO of Cap DevRoom, reporting to founder Shamikh Ahmed.
Write a concise board-level executive report from this portfolio data (JSON):
${JSON.stringify(data, null, 2)}

Structure:
1. Headline (one line: overall portfolio health + what to do this week)
2. Ship-ready apps (launch now)
3. Top 3 priorities (with the why)
4. Risks & blockers
5. Spend status
Keep under 350 words. Plain text with short section headers. Direct, executive tone.`;

  // Never let the report hard-fail — fall back to the deterministic summary.
  try {
    const result = await Agent.prompt(prompt, {
      apiKey: apiKey(),
      model: { id: "composer-2" },
      local: { cwd: DEVROOM_ROOT, settingSources: [] }, // DevRoom root — exec report is portfolio-wide, not project-specific
    });
    const narrative =
      typeof result?.result === "string" ? result.result : result?.result ? JSON.stringify(result.result) : "";
    if (!narrative.trim()) return { data, narrative: deterministicNarrative(data), ai: false };
    const tokens = Math.ceil(narrative.length / 4);
    await recordSpend(tokens, tokens * 0.000003);
    return { data, narrative, ai: true };
  } catch {
    return { data, narrative: deterministicNarrative(data), ai: false };
  }
}

function deterministicNarrative(d: ExecReportData): string {
  const top = d.scores.slice(0, 3).map((s, i) => `${i + 1}. ${s.name} — ${s.signal} (${s.priorityScore}/100): ${s.rationale}`);
  return [
    `PORTFOLIO HEALTH — ${d.generatedAt.slice(0, 10)}`,
    "",
    `Ship-ready: ${d.shipReady.length ? d.shipReady.join(", ") : "none yet"}`,
    `Needs fixing: ${d.needsFixing.length ? d.needsFixing.join(", ") : "none"}`,
    "",
    "TOP PRIORITIES",
    ...top,
    "",
    `OPEN: ${d.openApprovals} approvals · ${d.openIssues} issues`,
    `SPEND: $${d.budget.costUsd.toFixed(2)} / $${d.budget.capUsd.toFixed(2)} today`,
  ].join("\n");
}
