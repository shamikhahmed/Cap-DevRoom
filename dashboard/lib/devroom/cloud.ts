import { Agent, CursorAgentError } from "@cursor/sdk";
import { PORTFOLIO_APPS } from "./portfolio";

/** GitHub repos for Cloud Agents (production — not sandboxes) */
export const CLOUD_REPOS: Record<string, { url: string; branch?: string }> =
  Object.fromEntries(
    PORTFOLIO_APPS.map((p) => [
      p.id,
      {
        url: `https://github.com/shamikhahmed/${p.githubRepo}`,
        branch: "main",
      },
    ])
  );

// Legacy project ids → cloud repo
for (const p of PORTFOLIO_APPS) {
  for (const legacy of p.legacyIds) {
    CLOUD_REPOS[legacy] = CLOUD_REPOS[p.id];
  }
}

export interface CloudRunRequest {
  projectId: string;
  task: string;
  codename: string;
  createPR?: boolean;
}

export interface CloudRunResult {
  ok: boolean;
  status: string;
  output: string;
  agentId?: string;
  error?: string;
  retryable?: boolean;
}

function apiKey(): string {
  const key = process.env.CURSOR_API_KEY?.trim();
  if (!key)
    throw new Error(
      "CURSOR_API_KEY missing — add to dashboard/.env.local (from cursor.com/dashboard/integrations)"
    );
  return key;
}

export async function runCloudAgent(req: CloudRunRequest): Promise<CloudRunResult> {
  const repo = CLOUD_REPOS[req.projectId];
  if (!repo) {
    return {
      ok: false,
      status: "error",
      output: "",
      error: `No cloud repo mapped for ${req.projectId}`,
    };
  }

  const prompt = `You are ${req.codename}, an agent in Cap DevRoom (Shamikh Ahmed's executive office).

TASK (execute on the cloned repo):
${req.task}

Rules:
- Minimal focused changes
- Match existing code style
- Summarize what you changed at the end`;

  try {
    const result = await Agent.prompt(prompt, {
      apiKey: apiKey(),
      model: { id: "composer-2" },
      cloud: {
        repos: [{ url: repo.url, startingRef: repo.branch || "main" }],
        autoCreatePR: req.createPR ?? false,
        skipReviewerRequest: true,
      },
    });

    const output =
      typeof result.result === "string"
        ? result.result
        : JSON.stringify(result.result ?? result, null, 2);

    return {
      ok: result.status === "finished",
      status: result.status,
      output: output.slice(0, 16000),
      agentId: (result as { agentId?: string }).agentId,
    };
  } catch (err) {
    if (err instanceof CursorAgentError) {
      return {
        ok: false,
        status: "error",
        output: "",
        error: err.message,
        retryable: err.isRetryable,
      };
    }
    throw err;
  }
}

export function cloudSetupChecklist() {
  return [
    {
      step: 1,
      title: "Create API key",
      detail:
        "cursor.com/dashboard/integrations → User API Keys → Create",
      env: "CURSOR_API_KEY",
    },
    {
      step: 2,
      title: "Connect GitHub",
      detail: "Cursor Settings → GitHub — grant access to shamikhahmed/* repos",
      env: null,
    },
    {
      step: 3,
      title: "Default model",
      detail: "Cloud Agents → Defaults → composer-2 (or auto)",
      env: null,
    },
    {
      step: 4,
      title: "Default repository",
      detail: "Defaults → Default Repository → e.g. shamikhahmed/VaultCap",
      env: "DEVROOM_DEFAULT_REPO",
    },
    {
      step: 5,
      title: "Branch prefix",
      detail: "Defaults → Branch Prefix → capdevroom/",
      env: null,
    },
    {
      step: 6,
      title: "Pull requests",
      detail: "Create PRs → OFF for sandbox testing, ON for reviewable PRs",
      env: null,
    },
    {
      step: 7,
      title: "Local .env.local",
      detail: "Copy CURSOR_API_KEY into ~/Cap-DevRoom/dashboard/.env.local",
      env: "CURSOR_API_KEY",
    },
  ];
}
