import { drainWorker, ensureWorker } from "./worker";
import { runDue } from "./scheduled";
import { appendActivity } from "./store";
import { runPortfolioUptimeChecks } from "./uptime";
import { runSandboxHygiene } from "./sandbox-hygiene";
import { scanAll } from "./readiness";

const g = globalThis as unknown as {
  __devroomHeartbeat?: boolean;
  __devroomHeartbeatTick?: boolean;
};

const HEARTBEAT_ENABLED = process.env.DEVROOM_HEARTBEAT === "1";
const UPTIME_ENABLED = process.env.DEVROOM_UPTIME !== "0";

let lastCrewRun = 0;
let lastUptimeRun = 0;
let lastHygieneRun = 0;

const CREW_INTERVAL_MS = 15 * 60_000;
const UPTIME_INTERVAL_MS = 30 * 60_000;
const HYGIENE_INTERVAL_MS = 60 * 60_000;

async function heartbeatTick() {
  if (g.__devroomHeartbeatTick) return;
  g.__devroomHeartbeatTick = true;

  try {
    const hasKey = Boolean(process.env.CURSOR_API_KEY?.trim());
    const ran = await drainWorker(1);
    if (ran.length > 0) {
      await appendActivity({
        agent: "CORE",
        action: `Worker drained ${ran.length} job(s)`,
        type: "info",
      });
    }

    const now = Date.now();

    if (HEARTBEAT_ENABLED && hasKey && now - lastCrewRun > CREW_INTERVAL_MS) {
      lastCrewRun = now;
      const due = await runDue();
      if (due.ran.length > 0) {
        await appendActivity({
          agent: "CORE",
          action: `Scheduled crews ran: ${due.ran.length}`,
          type: "info",
        });
      }
    }

    if (UPTIME_ENABLED && now - lastUptimeRun > UPTIME_INTERVAL_MS) {
      lastUptimeRun = now;
      const checks = await runPortfolioUptimeChecks();
      const down = checks.filter((c) => c.status === "down").length;
      if (down > 0) {
        await appendActivity({
          agent: "VAULT",
          action: `${down} app(s) unreachable on live URL`,
          type: "critical",
        });
      }
    }

    if (now - lastHygieneRun > HYGIENE_INTERVAL_MS) {
      lastHygieneRun = now;
      const hygiene = await runSandboxHygiene();
      if (hygiene.autoSynced.length > 0) {
        await appendActivity({
          agent: "CORE",
          action: `Auto-synced sandboxes (${hygiene.autoSynced.length} apps)`,
          type: "info",
        });
      }
      if (hygiene.unpromoted.length > 0) {
        const total = hygiene.unpromoted.reduce((a, u) => a + u.fileCount, 0);
        await appendActivity({
          agent: "FORGE",
          action: `${total} un-promoted sandbox file(s) across ${hygiene.unpromoted.length} app(s)`,
          type: "warning",
        });
      }
    }
  } catch (e) {
    console.error("[heartbeat]", e);
  } finally {
    g.__devroomHeartbeatTick = false;
  }
}

/** Start background heartbeat (worker drain + optional crews/uptime/hygiene). */
export function ensureHeartbeat(): void {
  if (g.__devroomHeartbeat) return;
  g.__devroomHeartbeat = true;
  ensureWorker();
  setInterval(() => void heartbeatTick(), 60_000);
  setTimeout(() => void heartbeatTick(), 5000);
}

/** One-shot bootstrap: readiness scan all apps (no LLM cost). */
export async function bootstrapOffice(): Promise<{ readiness: unknown }> {
  await appendActivity({ agent: "CORE", action: "Office bootstrap: portfolio readiness scan", type: "info" });
  const portfolio = await scanAll();
  return { readiness: portfolio };
}
