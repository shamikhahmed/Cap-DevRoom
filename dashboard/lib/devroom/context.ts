import fs from "fs";
import path from "path";
import { DEVROOM_ROOT } from "./sandboxes";
import { normalizeProjectId, PORTFOLIO_APP_IDS } from "./portfolio";
import { ensureDbReady, prisma } from "./db";

const CONTEXT_MAP: Record<string, string> = {
  VaultCap: "docs/portfolio-context/vaultcap.md",
  PulseCap: "docs/portfolio-context/pulsecap.md",
  PrismCap: "docs/portfolio-context/prismcap.md",
  SteadyCap: "docs/portfolio-context/steadycap.md",
  LedgerCap: "docs/portfolio-context/ledgercap.md",
  DeePonyCap: "docs/portfolio-context/deeponycap.md",
  ScentCap: "docs/portfolio-context/scentcap.md",
  AuraCap: "docs/portfolio-context/auracap.md",
};

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", ".turbo"]);

export function loadPortfolioContext(projectId: string): string {
  const id = normalizeProjectId(projectId);
  const rel = CONTEXT_MAP[id];
  if (!rel) return "";
  const full = path.join(DEVROOM_ROOT, rel);
  try {
    if (!fs.existsSync(full)) return "";
    return fs.readFileSync(full, "utf8").slice(0, 4000);
  } catch {
    return "";
  }
}

export async function loadOpenIssuesContext(projectId: string, agent?: string): Promise<string> {
  await ensureDbReady();
  const id = normalizeProjectId(projectId);
  const issues = await prisma.issue.findMany({
    where: {
      projectId: id,
      status: { notIn: ["done", "canceled"] },
      ...(agent ? { agent: agent.toUpperCase() } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: { key: true, title: true, priority: true, status: true, type: true },
  });
  if (issues.length === 0) return "";
  const lines = issues.map(
    (i) => `- ${i.key} [${i.type}/${i.priority}] ${i.title} (${i.status})`
  );
  return `OPEN ISSUES:\n${lines.join("\n")}`;
}

export async function buildAgentContextBlock(
  projectId: string,
  codename: string
): Promise<string> {
  const parts: string[] = [];
  const ctx = loadPortfolioContext(projectId);
  if (ctx) parts.push(`PORTFOLIO CONTEXT:\n${ctx}`);
  const issues = await loadOpenIssuesContext(projectId, codename);
  if (issues) parts.push(issues);
  else {
    const allIssues = await loadOpenIssuesContext(projectId);
    if (allIssues) parts.push(allIssues);
  }
  return parts.length ? parts.join("\n\n") + "\n" : "";
}

export function listPortfolioContextFiles(): Array<{ projectId: string; path: string; exists: boolean }> {
  return PORTFOLIO_APP_IDS.map((id) => {
    const rel = CONTEXT_MAP[id];
    const full = rel ? path.join(DEVROOM_ROOT, rel) : "";
    return { projectId: id, path: rel ?? "", exists: Boolean(rel && fs.existsSync(full)) };
  });
}

export function walkSandboxFiles(root: string, max = 500): string[] {
  const out: string[] = [];
  function walk(dir: string) {
    if (out.length >= max) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (out.length >= max) break;
      if (SKIP_DIRS.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else out.push(full);
    }
  }
  walk(root);
  return out;
}
