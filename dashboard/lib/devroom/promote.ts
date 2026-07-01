import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { resolveSandbox } from "./sandboxes";
import { normalizeProjectId, productionPath } from "./portfolio";
import { walkSandboxFiles } from "./context";

const exec = promisify(execFile);

const SKIP = new Set(["node_modules", ".git", ".next", "dist", "build", ".turbo", ".DS_Store"]);

export type DiffStatus = "added" | "modified" | "deleted";

export interface DiffFile {
  path: string;
  status: DiffStatus;
}

function fileHash(filePath: string): string | null {
  try {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash("md5").update(buf).digest("hex");
  } catch {
    return null;
  }
}

function relativeFiles(root: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const abs of walkSandboxFiles(root, 800)) {
    const rel = path.relative(root, abs).replace(/\\/g, "/");
    if (rel.split("/").some((p) => SKIP.has(p))) continue;
    const h = fileHash(abs);
    if (h) map.set(rel, h);
  }
  return map;
}

export function diffSandbox(projectIdRaw: string): { projectId: string; files: DiffFile[]; count: number } {
  const projectId = normalizeProjectId(projectIdRaw);
  let sandbox: string;
  try {
    sandbox = resolveSandbox(projectId);
  } catch {
    return { projectId, files: [], count: 0 };
  }
  const production = productionPath(projectId);
  if (!fs.existsSync(production)) {
    return { projectId, files: [], count: 0 };
  }

  const sbMap = relativeFiles(sandbox);
  const prodMap = relativeFiles(production);
  const files: DiffFile[] = [];

  for (const [rel, hash] of sbMap) {
    const prodHash = prodMap.get(rel);
    if (!prodHash) files.push({ path: rel, status: "added" });
    else if (prodHash !== hash) files.push({ path: rel, status: "modified" });
  }
  for (const rel of prodMap.keys()) {
    if (!sbMap.has(rel)) files.push({ path: rel, status: "deleted" });
  }

  files.sort((a, b) => a.path.localeCompare(b.path));
  return { projectId, files, count: files.length };
}

export function countUnpromotedFiles(projectIdRaw: string): number {
  return diffSandbox(projectIdRaw).count;
}

/** Copy changed sandbox files to production (founder-confirmed). */
export async function promoteSandboxToProjects(projectIdRaw: string): Promise<{ copied: number; errors: string[] }> {
  const projectId = normalizeProjectId(projectIdRaw);
  const sandbox = resolveSandbox(projectId);
  const production = productionPath(projectId);
  const { files } = diffSandbox(projectId);
  const errors: string[] = [];
  let copied = 0;

  for (const f of files) {
    const src = path.join(sandbox, f.path);
    const dest = path.join(production, f.path);
    try {
      if (f.status === "deleted") {
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        copied++;
        continue;
      }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      copied++;
    } catch (e) {
      errors.push(`${f.path}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { copied, errors };
}

/** Reset sandbox from production via forward rsync. */
export async function discardSandboxChanges(projectIdRaw: string): Promise<void> {
  const projectId = normalizeProjectId(projectIdRaw);
  const sandbox = resolveSandbox(projectId);
  const production = productionPath(projectId);
  await exec("rsync", ["-a", "--delete", `${production}/`, `${sandbox}/`], { timeout: 120_000 });
}
