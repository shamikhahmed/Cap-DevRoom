import fs from "fs";
import path from "path";
import { PORTFOLIO_APPS, productionPath } from "./portfolio";

const HOME = process.env.HOME || "/tmp";

function defaultRoot(): string {
  const candidates = [
    process.env.DEVROOM_ROOT,
    path.join(HOME, "Desktop/Cap-DevRoom"),
    path.join(HOME, "Desktop/Projects/Cap-DevRoom"),
  ].filter(Boolean) as string[];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(HOME, "Desktop/Cap-DevRoom");
}

export const DEVROOM_ROOT = defaultRoot();

export const SANDBOX_ROOT =
  process.env.DEVROOM_SANDBOX_ROOT || path.join(DEVROOM_ROOT, "sandboxes");

function sandboxRootResolved(): string {
  return fs.realpathSync.native(SANDBOX_ROOT);
}

export function resolveSandbox(projectId: string): string {
  const normalized = projectId.trim();
  const compact = normalized.replace(/[^a-zA-Z0-9_-]/g, "");

  const isHub =
    /hub/i.test(normalized) ||
    compact === "CapricornHub" ||
    compact === "shamikhahmedgithubio";

  const candidates = isHub
    ? ["CapricornHub", "shamikhahmed.github.io", "hub", "VaultCap"]
    : [compact, normalized.replace(/\s+/g, "")];

  const root = sandboxRootResolved();
  for (const id of candidates) {
    if (!id) continue;
    const resolved = path.resolve(SANDBOX_ROOT, id);
    if (!resolved.startsWith(path.resolve(SANDBOX_ROOT) + path.sep) && resolved !== path.resolve(SANDBOX_ROOT)) {
      continue;
    }
    if (!fs.existsSync(resolved)) continue;
    return validateSandboxPath(resolved);
  }

  throw new Error(
    isHub
      ? `Hub sandbox missing. Sync shamikhahmed.github.io into sandboxes/CapricornHub or use a Cap app project.`
      : `Sandbox missing for ${projectId}. Run: npm run sync:sandboxes`
  );
}

/** Resolve symlinks and ensure cwd stays inside sandbox root, never production. */
export function validateSandboxPath(cwd: string): string {
  let real: string;
  try {
    real = fs.realpathSync.native(cwd);
  } catch {
    throw new Error(`Sandbox path unavailable: ${cwd}`);
  }

  const root = sandboxRootResolved();
  if (real !== root && !real.startsWith(root + path.sep)) {
    throw new Error("Blocked: sandbox path escapes sandboxes/ root");
  }

  assertNotProduction(real);
  return real;
}

export function listSandboxes(): Array<{ id: string; path: string; exists: boolean }> {
  return PORTFOLIO_APPS.map((p) => {
    const sb = path.join(SANDBOX_ROOT, p.id);
    return { id: p.id, path: sb, exists: fs.existsSync(sb) };
  });
}

export function assertNotProduction(cwd: string): void {
  const resolved = path.resolve(cwd);
  const prodRoots = PORTFOLIO_APPS.map((p) => {
    try {
      return fs.realpathSync.native(productionPath(p.id));
    } catch {
      return path.resolve(productionPath(p.id));
    }
  });

  for (const prod of prodRoots) {
    if (resolved === prod || resolved.startsWith(prod + path.sep)) {
      throw new Error("Blocked: agents cannot run against production project paths");
    }
  }
}

export const PORTFOLIO_SANDBOX_APPS = PORTFOLIO_APPS.map((p) => ({
  id: p.id,
  production: productionPath(p.id),
}));

export type PortfolioId = (typeof PORTFOLIO_APPS)[number]["id"];
