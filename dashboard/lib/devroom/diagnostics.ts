import { Cursor } from "@cursor/sdk";
import { listSandboxes } from "./sandboxes";
import { CLOUD_REPOS } from "./cloud";

export interface DiagnosticCheck {
  id: string;
  label: string;
  status: "pass" | "fail" | "warn" | "skip";
  detail: string;
}

const API_TIMEOUT_MS = 12_000;

async function withTimeout<T>(label: string, fn: () => Promise<T>): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${API_TIMEOUT_MS / 1000}s`)), API_TIMEOUT_MS)
    ),
  ]);
}

export async function runDiagnostics(): Promise<{
  ok: boolean;
  checks: DiagnosticCheck[];
  summary: string;
}> {
  const checks: DiagnosticCheck[] = [];
  const key = process.env.CURSOR_API_KEY?.trim();

  const sandboxes = listSandboxes();
  const synced = sandboxes.filter((s) => s.exists).length;
  const total = sandboxes.length;

  checks.push({
    id: "sandboxes",
    label: "Sandbox copies",
    status: synced === total && total > 0 ? "pass" : synced > 0 ? "warn" : "fail",
    detail:
      synced === total
        ? `${synced}/${total} apps synced to sandboxes/`
        : `${synced}/${total} synced — run scripts/sync-sandboxes.sh`,
  });

  checks.push({
    id: "api_key",
    label: "Cursor API key",
    status: key ? "pass" : "fail",
    detail: key ? "CURSOR_API_KEY found in .env.local" : "Missing — add key from Integrations dashboard",
  });

  if (!key) {
    checks.push({
      id: "cursor_auth",
      label: "Cursor API auth",
      status: "skip",
      detail: "Skipped — no API key",
    });
    checks.push({
      id: "github_repos",
      label: "GitHub repos",
      status: "skip",
      detail: "Skipped — no API key",
    });
  } else {
    try {
      const user = await withTimeout("Cursor auth", () => Cursor.me({ apiKey: key }));
      checks.push({
        id: "cursor_auth",
        label: "Cursor API auth",
        status: "pass",
        detail: user.userEmail && process.env.NODE_ENV !== "production"
          ? `Authenticated as ${user.userEmail}`
          : user.apiKeyName
            ? `API key valid (${user.apiKeyName})`
            : "API key valid",
      });
    } catch (e) {
      checks.push({
        id: "cursor_auth",
        label: "Cursor API auth",
        status: "fail",
        detail: e instanceof Error ? e.message : "Auth failed — check or regenerate key",
      });
    }

    try {
      const repos = await withTimeout("GitHub repo list", () => Cursor.repositories.list({ apiKey: key }));
      const mapped = Object.keys(CLOUD_REPOS);
      const connected = repos.map((r) => r.url?.replace(/\.git$/, "") ?? "");
      const missing = mapped.filter((id) => {
        const want = CLOUD_REPOS[id].url.toLowerCase();
        return !connected.some((c) => c.toLowerCase().includes(id.toLowerCase()) || want.includes(c.toLowerCase().split("/").pop() ?? ""));
      });
      checks.push({
        id: "github_repos",
        label: "GitHub repos",
        status: repos.length === 0 ? "warn" : missing.length > 0 ? "warn" : "pass",
        detail:
          repos.length === 0
            ? "No repos connected in Cursor — link GitHub in dashboard"
            : `${repos.length} repo(s) connected${missing.length ? ` · check: ${missing.join(", ")}` : ""}`,
      });
    } catch (e) {
      checks.push({
        id: "github_repos",
        label: "GitHub repos",
        status: "warn",
        detail: e instanceof Error ? e.message : "Could not list repos",
      });
    }
  }

  const whatsapp = Boolean(process.env.WHATSAPP_WEBHOOK_URL?.trim());
  checks.push({
    id: "whatsapp",
    label: "WhatsApp alerts",
    status: whatsapp ? "pass" : "skip",
    detail: whatsapp ? "Webhook configured" : "Optional — not set",
  });

  const fails = checks.filter((c) => c.status === "fail").length;
  const warns = checks.filter((c) => c.status === "warn").length;
  const ok = fails === 0;

  return {
    ok,
    checks,
    summary: fails
      ? `${fails} issue(s) need fixing`
      : warns
        ? `Working · ${warns} warning(s)`
        : "All systems ready",
  };
}
