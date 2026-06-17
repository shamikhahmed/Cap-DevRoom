import fs from "fs";
import path from "path";
import "./set-db-url";
import { prisma } from "@cap/devroom-database";
import { DEFAULT_APPROVALS, DEFAULT_PRIORITIES } from "../../app/lib/data";
import { DEVROOM_ROOT } from "./sandboxes";

const DATA_DIR = path.join(DEVROOM_ROOT, "data");

function readJson<T>(file: string): T | null {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch {
    return null;
  }
}

/** One-time migration from legacy JSON files into SQLite */
export async function migrateFromJsonIfEmpty() {
  const approvalCount = await prisma.approval.count();
  if (approvalCount > 0) return;

  const jsonApprovals = readJson<
    Array<{
      id: string;
      title: string;
      description: string;
      agent: string;
      projectId?: string;
      risk: string;
      status: string;
      createdAt: string;
      task?: string;
      source?: string;
    }>
  >("approvals.json");

  const seeds = jsonApprovals?.length
    ? jsonApprovals
    : DEFAULT_APPROVALS.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        agent: a.agent,
        projectId: a.projectId ?? "VaultCap",
        risk: a.risk,
        status: a.status,
        createdAt: a.createdAt,
        source: "demo" as const,
      }));

  for (const a of seeds) {
    await prisma.approval.create({
      data: {
        id: a.id,
        title: a.title,
        description: a.description,
        agent: a.agent,
        projectId: a.projectId ?? "VaultCap",
        risk: a.risk,
        status: a.status as "pending" | "approved" | "rejected",
        task: "task" in a ? a.task : undefined,
        source: ("source" in a ? a.source : undefined) ?? "demo",
        createdAt: new Date(a.createdAt),
      },
    });
  }

  const priorityCount = await prisma.priority.count();
  if (priorityCount === 0) {
    await prisma.priority.createMany({
      data: DEFAULT_PRIORITIES.map((p, i) => ({
        id: p.id,
        text: p.text,
        done: p.done,
        sortOrder: i,
      })),
    });
  }

  const activity = readJson<
    Array<{
      id: string;
      time: string;
      agent: string;
      action: string;
      type: "info" | "warning" | "critical" | "success";
      projectId?: string;
    }>
  >("activity.json");

  if (activity?.length) {
    const existing = await prisma.activityLog.count();
    if (existing === 0) {
      for (const entry of activity.slice(0, 200)) {
        await prisma.activityLog.create({
          data: {
            agent: entry.agent,
            action: entry.action,
            type: entry.type,
            projectId: entry.projectId,
            createdAt: new Date(entry.time),
          },
        });
      }
    }
  }
}
