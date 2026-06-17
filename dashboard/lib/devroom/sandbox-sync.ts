import fs from "fs";
import path from "path";
import { DEVROOM_ROOT } from "./sandboxes";

export interface SandboxSyncMeta {
  syncedAt: string;
  apps: string[];
  projectsRoot: string;
}

const META_PATH = path.join(DEVROOM_ROOT, "data", "sandbox-sync.json");
const STALE_DAYS = 7;

export function readSandboxSyncMeta(): SandboxSyncMeta | null {
  try {
    if (!fs.existsSync(META_PATH)) return null;
    return JSON.parse(fs.readFileSync(META_PATH, "utf8")) as SandboxSyncMeta;
  } catch {
    return null;
  }
}

export function sandboxSyncStatus(): {
  lastSyncAt: string | null;
  stale: boolean;
  staleDays: number;
  daysSinceSync: number | null;
} {
  const meta = readSandboxSyncMeta();
  if (!meta?.syncedAt) {
    return { lastSyncAt: null, stale: true, staleDays: STALE_DAYS, daysSinceSync: null };
  }
  const synced = new Date(meta.syncedAt);
  const days = (Date.now() - synced.getTime()) / (1000 * 60 * 60 * 24);
  return {
    lastSyncAt: meta.syncedAt,
    stale: days > STALE_DAYS,
    staleDays: STALE_DAYS,
    daysSinceSync: Math.floor(days),
  };
}
