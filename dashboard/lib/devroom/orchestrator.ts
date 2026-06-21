import { Agent, CursorAgentError } from "@cursor/sdk";
import { getAgent } from "./agents";
import { DEVROOM_ROOT, resolveSandbox, validateSandboxPath } from "./sandboxes";
import { normalizeProjectId } from "./portfolio";
import { appendActivity } from "./store";
import { createJob } from "./jobs";
import { getOfficeMemorySnapshot } from "./memory";
import { assertWithinBudget, recordSpend, BudgetExceededError } from "./budget";
import { parseCeoResponse } from "./validate";
import { apiKey, extractTokens, extractCost, kickWorker } from "./worker";
import type { RiskTier } from "../../app/lib/data";

export interface RunAgentRequest {
  codename: string;
  task: string;
  projectId: string;
  risk?: RiskTier;
}

export interface RunAgentResult {
  ok: boolean;
  status: string;
  output: string;
  needsApproval?: boolean;
  approvalId?: string;
  jobId?: string;
  error?: string;
  retryable?: boolean;
}

export interface CeoAssignment {
  agent: string;
  task: string;
  project: string;
  risk: RiskTier;
  reason: string;
}

export interface CeoCommandResult {
  ok: boolean;
  greeting: string;
  message: string;
  assignments: CeoAssignment[];
  error?: string;
}

function riskNeedsApproval(risk: RiskTier): boolean {
  return risk === "Medium" || risk === "High";
}

export async function runAgent(req: RunAgentRequest): Promise<RunAgentResult> {
  return runAgentInternal(req, false);
}

/** Server-only — after founder approval. Never expose to client API. */
export async function runAgentAfterApproval(req: RunAgentRequest): Promise<RunAgentResult> {
  return runAgentInternal(req, true);
}

/**
 * Enqueue an agent run. Execution happens in the durable worker (worker.ts), not
 * in this HTTP request — so a gateway timeout can never orphan a run. Callers get
 * a jobId immediately and poll /api/jobs/{id} (the job drawer does this).
 */
async function runAgentInternal(req: RunAgentRequest, founderApproved: boolean): Promise<RunAgentResult> {
  const projectId = normalizeProjectId(req.projectId);
  const def = getAgent(req.codename);
  if (!def) return { ok: false, status: "error", output: "", error: `Unknown agent ${req.codename}` };

  const risk = req.risk ?? def.defaultRisk;
  if (riskNeedsApproval(risk) && !founderApproved) {
    const { addApproval } = await import("./store");
    const apr = await addApproval({
      title: `${def.codename}: ${req.task.slice(0, 80)}`,
      description: req.task,
      agent: def.codename,
      projectId,
      risk,
      task: req.task,
    });
    return {
      ok: true,
      status: "pending_approval",
      output: `Queued for CEO approval (${risk} risk).`,
      needsApproval: true,
      approvalId: apr.id,
    };
  }

  // Fast budget pre-check so the user gets immediate feedback (worker re-checks at run time).
  try {
    await assertWithinBudget();
  } catch (e) {
    if (e instanceof BudgetExceededError) {
      return { ok: false, status: "error", output: "", error: e.message };
    }
    throw e;
  }

  const job = await createJob({ codename: req.codename, task: req.task, projectId, risk });
  kickWorker();

  return {
    ok: true,
    status: "queued",
    output: `Queued — ${def.codename} is running in the background. Watch the job drawer for progress.`,
    jobId: job.id,
  };
}

function planningSandbox(projectId: string): string {
  const cwd = resolveSandbox(projectId);
  return validateSandboxPath(cwd);
}

export async function runCeoCommand(command: string, projectIdRaw = "VaultCap"): Promise<CeoCommandResult> {
  const projectId = normalizeProjectId(projectIdRaw);
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  try {
    await assertWithinBudget();
  } catch (e) {
    if (e instanceof BudgetExceededError) {
      return { ok: false, greeting: timeGreeting + ", Shamikh.", message: "", assignments: [], error: e.message };
    }
    throw e;
  }

  const agentList = (await import("./agents")).DEVROOM_AGENTS.filter((a) => a.codename !== "APEX")
    .map((a) => `${a.codename} (${a.name}): ${a.skills.join(", ")}`)
    .join("\n");

  let cwd: string;
  try {
    cwd = planningSandbox(projectId);
  } catch (e) {
    return {
      ok: false,
      greeting: timeGreeting + ", Shamikh.",
      message: "",
      assignments: [],
      error: e instanceof Error ? e.message : "Sandbox unavailable",
    };
  }

  const basePrompt = `${getAgent("APEX")!.systemPrompt}

Available agents:
${agentList}

CEO command from Shamikh:
"${command}"

Default project context: ${projectId} (sandbox at ${cwd})
Time: ${new Date().toISOString()}

Respond with VALID JSON only (no markdown fences):
{
  "greeting": "${timeGreeting}, Shamikh.",
  "message": "executive summary",
  "assignments": [{ "agent": "CODENAME", "task": "...", "project": "${projectId}", "risk": "Low|Medium|High", "reason": "..." }]
}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt =
      attempt === 0
        ? basePrompt
        : basePrompt + `\n\nIMPORTANT: Your previous reply was not valid JSON. Reply with ONLY the JSON object, nothing else.`;
    try {
      const result = await Agent.prompt(prompt, {
        apiKey: apiKey(),
        model: { id: "composer-2" },
        local: { cwd, settingSources: [] },
      });

      const raw = typeof result.result === "string" ? result.result : JSON.stringify(result.result);
      const tokens = extractTokens(result, raw);
      const { costUsd } = extractCost(result, tokens);
      await recordSpend(tokens, costUsd);

      const parsed = parseCeoResponse(raw, projectId);
      if (!parsed) {
        if (attempt === 0) continue;
        return { ok: true, greeting: timeGreeting + ", Shamikh.", message: raw.slice(0, 2000), assignments: [] };
      }

      await appendActivity({ agent: "APEX", action: `CEO command: ${command.slice(0, 80)}`, type: "info", projectId });

      return {
        ok: true,
        greeting: parsed.greeting || timeGreeting + ", Shamikh.",
        message: parsed.message,
        assignments: parsed.assignments,
      };
    } catch (err) {
      if (attempt === 1) {
        const msg = err instanceof CursorAgentError ? err.message : String(err);
        return { ok: false, greeting: timeGreeting + ", Shamikh.", message: "", assignments: [], error: msg };
      }
    }
  }

  return { ok: false, greeting: timeGreeting + ", Shamikh.", message: "", assignments: [], error: "Planning failed" };
}

export async function generateBriefing(projectId = "VaultCap"): Promise<string> {
  await assertWithinBudget();
  const { scanDeliverables, deliverablesSummary } = await import("./deliverables");
  const hits = scanDeliverables();
  const summary = deliverablesSummary(hits);
  const { listServerApprovals } = await import("./store");
  const pending = (await listServerApprovals()).filter((a) => a.status === "pending");
  const officeMemory = await getOfficeMemorySnapshot();

  let cwd: string;
  try {
    cwd = planningSandbox(projectId);
  } catch {
    cwd = DEVROOM_ROOT;
  }

  const prompt = `You are APEX (CEO). Write a morning briefing for Shamikh Ahmed.
Portfolio deliverables scan: ${JSON.stringify(summary)}
Pending approvals: ${pending.length}
Sandbox project focus: ${projectId}
${officeMemory ? `Recent agent work:\n${officeMemory}\n` : ""}
Include: greeting, top 3 priorities, missing deliverables (README/pitch/slides per project), pending approvals summary, one focus recommendation.
Keep under 400 words. Plain text with section headers.`;

  const result = await Agent.prompt(prompt, {
    apiKey: apiKey(),
    model: { id: "composer-2" },
    local: { cwd, settingSources: [] },
  });

  const out = typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2);
  const tokens = extractTokens(result, out);
  const { costUsd } = extractCost(result, tokens);
  await recordSpend(tokens, costUsd);
  return out;
}
