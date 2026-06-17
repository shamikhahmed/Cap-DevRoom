import fs from "fs";
import path from "path";
import { SANDBOX_ROOT } from "./sandboxes";

export type DeliverableKind =
  | "readme"
  | "pitch"
  | "presentation"
  | "changelog"
  | "docs";

export interface DeliverableHit {
  projectId: string;
  kind: DeliverableKind;
  relativePath: string;
  sizeBytes: number;
  modifiedAt: string;
}

const PATTERNS: Array<{ kind: DeliverableKind; test: (name: string, rel: string) => boolean }> = [
  {
    kind: "readme",
    test: (n) => /^readme/i.test(n) && /\.(md|txt|rst)$/i.test(n),
  },
  {
    kind: "pitch",
    test: (n, rel) =>
      /pitch|investor|fundraising|one-?pager|deck-outline/i.test(n) ||
      /pitch|investor/i.test(rel),
  },
  {
    kind: "presentation",
    test: (n) =>
      /\.(pptx?|key|slides?)$/i.test(n) ||
      /presentation|slides|deck/i.test(n),
  },
  {
    kind: "changelog",
    test: (n) => /^changelog/i.test(n),
  },
  {
    kind: "docs",
    test: (n, rel) =>
      (rel.startsWith("docs/") || rel.startsWith("doc/")) && /\.(md|mdx)$/i.test(n),
  },
];

function walk(dir: string, base: string, out: DeliverableHit[], projectId: string) {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (ent.name.startsWith(".") || ent.name === "node_modules") continue;
    const full = path.join(dir, ent.name);
    const rel = path.relative(base, full);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".git" || ent.name === ".next") continue;
      walk(full, base, out, projectId);
      continue;
    }
    for (const p of PATTERNS) {
      if (p.test(ent.name, rel)) {
        const stat = fs.statSync(full);
        out.push({
          projectId,
          kind: p.kind,
          relativePath: rel,
          sizeBytes: stat.size,
          modifiedAt: stat.mtime.toISOString(),
        });
        break;
      }
    }
  }
}

export function scanDeliverables(projectIds?: string[]): DeliverableHit[] {
  const hits: DeliverableHit[] = [];
  if (!fs.existsSync(SANDBOX_ROOT)) return hits;

  const dirs = projectIds?.length
    ? projectIds
    : fs.readdirSync(SANDBOX_ROOT).filter((d) => !d.startsWith("."));

  for (const id of dirs) {
    const root = path.join(SANDBOX_ROOT, id);
    if (!fs.statSync(root).isDirectory()) continue;
    walk(root, root, hits, id);
  }
  return hits.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}

export function deliverablesSummary(hits: DeliverableHit[]) {
  const byProject: Record<string, Partial<Record<DeliverableKind, number>>> = {};
  for (const h of hits) {
    if (!byProject[h.projectId]) byProject[h.projectId] = {};
    byProject[h.projectId][h.kind] = (byProject[h.projectId][h.kind] || 0) + 1;
  }
  return byProject;
}
