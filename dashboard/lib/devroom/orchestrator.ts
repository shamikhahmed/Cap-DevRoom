import { Agent, CursorAgentError } from "@cursor/sdk";
import { getAgent } from "./agents";
import { assertNotProduction, DEVROOM_ROOT, resolveSandbox, validateSandboxPath } from "./sandboxes";
import { normalizeProjectId } from "./portfolio";
import { appendActivity } from "./store";
import { createJob, setJobStatus } from "./jobs";
import { getMemoryContext, getOfficeMemorySnapshot, recordAgentWork } from "./memory";
import { withSandboxLock } from "./sandbox-queue";
import type { RiskTier } from "../../app/lib/data";

/** Cursor composer-2 rough cost per token (USD) for salary display */
const COST_PER_TOKEN = 0.000003;

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
  tokensUsed?: number;
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

function apiKey(): string {
  const key = process.env.CURSOR_API_KEY?.trim();
  if (!key) throw new Error("CURSOR_API_KEY missing — add to dashboard/.env.local");
  return key;
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function extractTokens(result: unknown, output: string): number {
  const r = result as { usage?: { totalTokens?: number }; tokensUsed?: number };
  if (typeof r?.usage?.totalTokens === "number") return r.usage.totalTokens;
  if (typeof r?.tokensUsed === "number") return r.tokensUsed;
  return estimateTokens(output);
}

async function buildAgentPrompt(codename: string, task: string, projectId: string, cwd: string): Promise<string> {
  const def = getAgent(codename);
  if (!def) throw new Error(`Unknown agent: ${codename}`);

  const memory = await getMemoryContext(codename);

  return `${def.systemPrompt}
${memory ? `\nRECENT WORK MEMORY:\n${memory}\n` : ""}
---
SANDBOX ONLY: You are working in a COPY at ${cwd}
Project: ${projectId}
NEVER reference or modify production paths under ~/Desktop/Projects/

TASK:
${task}

RULES:
- Minimal scope. Propose changes; implement only if task says "implement" or "fix".
- List files you would change.
- If checking deliverables (README, pitch, slides), report what already exists first.
- End with a short executive summary for the CEO.`;
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

  return withSandboxLock(projectId, async () => {
    const job = await createJob({
      codename: req.codename,
      task: req.task,
      projectId,
      risk,
    });
    await setJobStatus(job.id, "PROCESSING");

    let cwd: string;
    try {
      cwd = resolveSandbox(projectId);
      assertNotProduction(cwd);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sandbox error";
      await setJobStatus(job.id, "FAILED", { error: msg });
      return { ok: false, status: "error", output: "", error: msg, jobId: job.id };
    }

    const prompt = await buildAgentPrompt(req.codename, req.task, projectId, cwd);

    try {
      const result = await Agent.prompt(prompt, {
        apiKey: apiKey(),
        model: { id: "composer-2" },
        local: { cwd, settingSources: [] },
      });

      const output =
        typeof result.result === "string"
          ? result.result
          : JSON.stringify(result.result ?? result, null, 2);

      const tokensUsed = extractTokens(result, output);
      const costUsd = tokensUsed * COST_PER_TOKEN;

      await appendActivity({
        agent: req.codename,
        action: req.task.slice(0, 120),
        type: result.status === "finished" ? "success" : "warning",
        projectId,
      });

      await setJobStatus(job.id, result.status === "finished" ? "COMPLETED" : "FAILED", {
        output: output.slice(0, 12000),
        tokensUsed,
        costUsd,
      });

      if (result.status === "finished") {
        await recordAgentWork(
          req.codename,
          req.task.slice(0, 80),
          output.slice(0, 600),
          founderApproved ? "approved" : "completed"
        );
      }

      return {
        ok: result.status === "finished",
        status: result.status,
        output: output.slice(0, 12000),
        jobId: job.id,
        tokensUsed,
      };
    } catch (err) {
      await setJobStatus(job.id, "FAILED", {
        error: err instanceof Error ? err.message : String(err),
      });
      if (err instanceof CursorAgentError) {
        return {
          ok: false,
          status: "error",
          output: "",
          error: err.message,
          retryable: err.isRetryable,
          jobId: job.id,
        };
      }
      throw err;
    }
  });
}

function planningSandbox(projectId: string): string {
  const cwd = resolveSandbox(projectId);
  return validateSandboxPath(cwd);
}

export async function runCeoCommand(command: string, projectIdRaw = "VaultCap"): Promise<CeoCommandResult> {
  const projectId = normalizeProjectId(projectIdRaw);
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

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

  const prompt = `${getAgent("APEX")!.systemPrompt}

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

  try {
    const result = await Agent.prompt(prompt, {
      apiKey: apiKey(),
      model: { id: "composer-2" },
      local: { cwd, settingSources: [] },
    });

    const raw =
      typeof result.result === "string" ? result.result : JSON.stringify(result.result);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        ok: true,
        greeting: timeGreeting + ", Shamikh.",
        message: raw.slice(0, 2000),
        assignments: [],
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      greeting?: string;
      message?: string;
      assignments?: CeoAssignment[];
    };

    await appendActivity({
      agent: "APEX",
      action: `CEO command: ${command.slice(0, 80)}`,
      type: "info",
      projectId,
    });

    return {
      ok: true,
      greeting: parsed.greeting || timeGreeting + ", Shamikh.",
      message: parsed.message || "",
      assignments: parsed.assignments || [],
    };
  } catch (err) {
    const msg = err instanceof CursorAgentError ? err.message : String(err);
    return {
      ok: false,
      greeting: timeGreeting + ", Shamikh.",
      message: "",
      assignments: [],
      error: msg,
    };
  }
}

export async function generateBriefing(projectId = "VaultCap"): Promise<string> {
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

  return typeof result.result === "string"
    ? result.result
    : JSON.stringify(result.result, null, 2);
}
