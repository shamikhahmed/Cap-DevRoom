import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import { DEVROOM_ROOT } from "./sandboxes";
import { PORTFOLIO_APP_IDS, productionPath } from "./portfolio";
import { sandboxSyncStatus } from "./sandbox-sync";
import { countUnpromotedFiles } from "./promote";

const exec = promisify(execFile);

const AUTO_SYNC_DAYS = 3;

export interface SandboxHygieneReport {
  stale: boolean;
  daysSinceSync: number | null;
  unpromoted: Array<{ projectId: string; fileCount: number }>;
  autoSynced: string[];
}

export async function runSandboxHygiene(): Promise<SandboxHygieneReport> {
  const sync = sandboxSyncStatus();
  const unpromoted: Array<{ projectId: string; fileCount: number }> = [];
  const autoSynced: string[] = [];

  for (const id of PORTFOLIO_APP_IDS) {
    const count = countUnpromotedFiles(id);
    if (count > 0) unpromoted.push({ projectId: id, fileCount: count });
  }

  const days = sync.daysSinceSync ?? 999;
  if (sync.stale && days >= AUTO_SYNC_DAYS && unpromoted.length === 0) {
    try {
      const script = path.join(DEVROOM_ROOT, "scripts", "sync-sandboxes.sh");
      await exec("bash", [script], { timeout: 300_000, cwd: DEVROOM_ROOT });
      autoSynced.push(...PORTFOLIO_APP_IDS);
    } catch (e) {
      console.error("[sandbox-hygiene] auto-sync failed", e);
    }
  }

  return {
    stale: sync.stale,
    daysSinceSync: sync.daysSinceSync,
    unpromoted,
    autoSynced,
  };
}

export function projectsRoot(): string {
  return productionPath("VaultCap").replace(/VaultCap$/, "").replace(/\/$/, "");
}
