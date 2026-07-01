import { Agent, CursorAgentError } from "@cursor/sdk";
import { getAgent, resolveModelId } from "./agents";
import { assertNotProduction, resolveSandbox } from "./sandboxes";
import { appendActivity } from "./store";
import { setJobStatus, getJob } from "./jobs";
import { ensureDbReady, prisma } from "./db";
import { getMemoryContext, recordAgentWork } from "./memory";
import { acquireSandboxLock, releaseSandboxLock } from "./locks";
import { assertWithinBudget, recordSpend, BudgetExceededError } from "./budget";
import { buildAgentContextBlock } from "./context";
import { createIssuesFromJobOutput } from "./issue-from-job";
import { shouldRunTests, runSandboxTests } from "./test-runner";
import { ensureHeartbeat } from "./heartbeat";

/**
 * Durable job worker. Agent runs no longer execute inside the HTTP request —
 * they are enqueued (PENDING) and drained by this worker, so a request/gateway
 * timeout never kills work in flight. Long-lived processes run an interval;
 * serverless/cron can hit /api/worker/tick to drain.
 */

const EST_COST_PER_TOKEN = 0.000003;

export function apiKey(): string {
  const key = process.env.CURSOR_API_KEY?.trim();
  if (!key) throw new Error("CURSOR_API_KEY missing — add to dashboard/.env.local");
  return key;
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function extractTokens(result: unknown, output: string): number {
  const r = result as { usage?: { totalTokens?: number }; tokensUsed?: number };
  if (typeof r?.usage?.totalTokens === "number") return r.usage.totalTokens;
  if (typeof r?.tokensUsed === "number") return r.tokensUsed;
  return estimateTokens(output);
}

export function extractCost(result: unknown, tokens: number): { costUsd: number; estimated: boolean } {
  const r = result as { usage?: { costUsd?: number; totalCostUsd?: number }; costUsd?: number };
  const real = r?.usage?.costUsd ?? r?.usage?.totalCostUsd ?? r?.costUsd;
  if (typeof real === "number" && real > 0) return { costUsd: real, estimated: false };
  return { costUsd: tokens * EST_COST_PER_TOKEN, estimated: true };
}

async function buildAgentPrompt(codename: string, task: string, projectId: string, cwd: string): Promise<string> {
  const def = getAgent(codename);
  if (!def) throw new Error(`Unknown agent: ${codename}`);
  const memory = await getMemoryContext(codename);
  const portfolioCtx = await buildAgentContextBlock(projectId, codename);
  return `${def.systemPrompt}
${portfolioCtx}${memory ? `\nRECENT WORK MEMORY:\n${memory}\n` : ""}
---
SANDBOX ONLY: You are working in a COPY at ${cwd}
Project: ${projectId}
NEVER reference or modify production paths under ~/Desktop/Projects/

TASK:
${task}

RULES:
- Minimal scope. Propose changes; implement only if task says "implement" or "fix".
- List files you would change.
- If you find bugs or debt worth tracking, add lines: ISSUE: short title
- If checking deliverables (README, pitch, slides), report what already exists first.
- End with a short executive summary for the CEO.`;
}

/** Execute one job end-to-end. Assumes the job exists and is PENDING/PROCESSING. */
export async function executeJob(jobId: string): Promise<void> {
  const job = await getJob(jobId);
  if (!job) return;

  // Med/High risk only reach a job after founder approval (unapproved ones become approvals).
  const founderApproved = job.risk === "Medium" || job.risk === "High";

  try {
    await assertWithinBudget();
  } catch (e) {
    if (e instanceof BudgetExceededError) {
      await setJobStatus(job.id, "FAILED", { error: e.message });
      return;
    }
    throw e;
  }

  await setJobStatus(job.id, "PROCESSING");
  await appendActivity({
    agent: job.codename,
    action: `Processing: ${job.task.slice(0, 100)}`,
    type: "info",
    projectId: job.projectId,
  });

  let cwd: string;
  try {
    cwd = resolveSandbox(job.projectId);
    assertNotProduction(cwd);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sandbox error";
    await setJobStatus(job.id, "FAILED", { error: msg });
    await appendActivity({
      agent: job.codename,
      action: `Failed (sandbox): ${msg.slice(0, 100)}`,
      type: "critical",
      projectId: job.projectId,
    });
    return;
  }

  const prompt = await buildAgentPrompt(job.codename, job.task, job.projectId, cwd);

  try {
    const def = getAgent(job.codename);
    const modelId = resolveModelId(def?.defaultModel);
    const result = await Agent.prompt(prompt, {
      apiKey: apiKey(),
      model: { id: modelId },
      local: { cwd, settingSources: [] },
    });

    const output =
      typeof result.result === "string" ? result.result : JSON.stringify(result.result ?? result, null, 2);
    const tokensUsed = extractTokens(result, output);
    const { costUsd } = extractCost(result, tokensUsed);
    await recordSpend(tokensUsed, costUsd);

    let testResultJson: string | undefined;

    await appendActivity({
      agent: job.codename,
      action: job.task.slice(0, 120),
      type: result.status === "finished" ? "success" : "warning",
      projectId: job.projectId,
    });

    if (result.status === "finished" && shouldRunTests(job.codename)) {
      const testResult = await runSandboxTests(cwd);
      testResultJson = JSON.stringify(testResult);
      await appendActivity({
        agent: job.codename,
        action: testResult.pass ? "Tests passed" : "Tests failed",
        type: testResult.pass ? "success" : "warning",
        projectId: job.projectId,
      });
    }

    await setJobStatus(job.id, result.status === "finished" ? "COMPLETED" : "FAILED", {
      output: output.slice(0, 12000),
      tokensUsed,
      costUsd,
      testResult: testResultJson,
    });

    if (result.status === "finished") {
      const keys = await createIssuesFromJobOutput(job.id, job.codename, job.projectId, output);
      if (keys.length > 0) {
        await appendActivity({
          agent: job.codename,
          action: `Filed ${keys.length} issue(s): ${keys.join(", ")}`,
          type: "info",
          projectId: job.projectId,
        });
      }
      await recordAgentWork(
        job.codename,
        job.task.slice(0, 80),
        output.slice(0, 600),
        founderApproved ? "approved" : "completed"
      );
    }
  } catch (err) {
    const msg = err instanceof CursorAgentError ? err.message : err instanceof Error ? err.message : String(err);
    await setJobStatus(job.id, "FAILED", { error: msg });
    await appendActivity({
      agent: job.codename,
      action: `Failed: ${msg.slice(0, 100)}`,
      type: "critical",
      projectId: job.projectId,
    });
  }
}

/** Drain up to `max` PENDING jobs, respecting per-sandbox locks. Returns ids run. */
export async function drainWorker(max = 3): Promise<string[]> {
  await ensureDbReady();
  const ran: string[] = [];
  for (let i = 0; i < max; i++) {
    const pending = await prisma.agentJob.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 8,
    });
    if (pending.length === 0) break;

    let picked: string | null = null;
    for (const job of pending) {
      const got = await acquireSandboxLock(job.projectId, job.id);
      if (!got) continue; // sandbox busy — try another project's job
      try {
        await executeJob(job.id);
        ran.push(job.id);
      } finally {
        await releaseSandboxLock(job.projectId);
      }
      picked = job.id;
      break;
    }
    if (!picked) break; // all pending jobs blocked by locks this pass
  }
  return ran;
}

// ── In-process drain loop (long-lived servers) ──────────────
const g = globalThis as unknown as { __devroomWorker?: boolean; __devroomDraining?: boolean };

async function tick() {
  if (g.__devroomDraining) return;
  g.__devroomDraining = true;
  try {
    await drainWorker(3);
  } catch {
    /* keep ticking */
  } finally {
    g.__devroomDraining = false;
  }
}

/** Start the background drain loop once (lazy — only on first request, never at build). */
export function ensureWorker(): void {
  if (g.__devroomWorker) return;
  g.__devroomWorker = true;
  setInterval(() => void tick(), 3000);
  ensureHeartbeat();
}

/** Nudge the worker to drain immediately after enqueue. */
export function kickWorker(): void {
  ensureWorker();
  setTimeout(() => void tick(), 10);
}
