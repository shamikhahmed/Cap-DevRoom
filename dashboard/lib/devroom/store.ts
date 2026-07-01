import { DEFAULT_APPROVALS } from "../../app/lib/data";
import { ensureDbReady, prisma } from "./db";

export interface ServerApproval {
  id: string;
  title: string;
  description: string;
  agent: string;
  projectId: string;
  risk: "Low" | "Medium" | "High";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  task?: string;
  source?: "demo" | "agent";
  decidedBy?: string;
  decidedAt?: string;
}

export interface ActivityLogEntry {
  id: string;
  time: string;
  agent: string;
  action: string;
  type: "info" | "warning" | "critical" | "success";
  projectId?: string;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toServerApproval(row: {
  id: string;
  title: string;
  description: string;
  agent: string;
  projectId: string;
  risk: string;
  status: string;
  createdAt: Date;
  task: string | null;
  source: string;
  decidedBy?: string | null;
  decidedAt?: Date | null;
}): ServerApproval {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    agent: row.agent,
    projectId: row.projectId,
    risk: row.risk as ServerApproval["risk"],
    status: row.status as ServerApproval["status"],
    createdAt: formatDate(row.createdAt),
    task: row.task ?? undefined,
    source: row.source as ServerApproval["source"],
    decidedBy: row.decidedBy ?? undefined,
    decidedAt: row.decidedAt ? row.decidedAt.toISOString() : undefined,
  };
}

export async function ensureServerApprovalsSeeded(): Promise<ServerApproval[]> {
  await ensureDbReady();
  const rows = await prisma.approval.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toServerApproval);
}

export function getServerApprovals(): ServerApproval[] {
  throw new Error("Use ensureServerApprovalsSeeded() — store is async with Prisma");
}

export async function listServerApprovals(): Promise<ServerApproval[]> {
  await ensureDbReady();
  const rows = await prisma.approval.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toServerApproval);
}

export async function saveServerApprovals(_approvals: ServerApproval[]) {
  /* legacy no-op — use updateApproval */
}

export async function resetServerApprovals(): Promise<ServerApproval[]> {
  await ensureDbReady();
  await prisma.approval.deleteMany();
  for (const a of DEFAULT_APPROVALS) {
    await prisma.approval.create({
      data: {
        title: a.title,
        description: a.description,
        agent: a.agent,
        projectId: a.projectId ?? "VaultCap",
        risk: a.risk,
        status: a.status,
        source: "demo",
        createdAt: new Date(a.createdAt),
      },
    });
  }
  return listServerApprovals();
}

export async function addApproval(
  item: Omit<ServerApproval, "id" | "createdAt" | "status" | "source">
): Promise<ServerApproval> {
  await ensureDbReady();
  const row = await prisma.approval.create({
    data: {
      title: item.title,
      description: item.description,
      agent: item.agent,
      projectId: item.projectId,
      risk: item.risk,
      status: "pending",
      task: item.task,
      source: "agent",
    },
  });
  return toServerApproval(row);
}

export async function updateApproval(
  id: string,
  status: "approved" | "rejected",
  actor = "founder"
) {
  await ensureDbReady();
  const existing = await prisma.approval.findUnique({ where: { id } });
  if (!existing) throw new Error("not found");

  const row = await prisma.approval.update({
    where: { id },
    data: {
      status,
      decidedBy: actor,
      decidedAt: new Date(),
      ...(status === "approved" && !existing.task
        ? {
            task: `Execute approved work: ${existing.title}. ${existing.description}`,
          }
        : {}),
    },
  });

  await appendActivity({
    agent: row.agent,
    action: `Approval ${status}: ${row.title.slice(0, 80)}`,
    type: status === "approved" ? "success" : "warning",
    projectId: row.projectId,
  });

  return toServerApproval(row);
}

export async function getActivityLog(): Promise<ActivityLogEntry[]> {
  await ensureDbReady();
  const rows = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return rows.map((r) => ({
    id: r.id,
    time: r.createdAt.toISOString(),
    agent: r.agent,
    action: r.action,
    type: r.type as ActivityLogEntry["type"],
    projectId: r.projectId ?? undefined,
  }));
}

export async function appendActivity(entry: Omit<ActivityLogEntry, "id" | "time">) {
  await ensureDbReady();
  await prisma.activityLog.create({
    data: {
      agent: entry.agent,
      action: entry.action,
      type: entry.type,
      projectId: entry.projectId,
    },
  });
  const count = await prisma.activityLog.count();
  if (count > 250) {
    const oldest = await prisma.activityLog.findMany({
      orderBy: { createdAt: "asc" },
      take: count - 200,
      select: { id: true },
    });
    await prisma.activityLog.deleteMany({
      where: { id: { in: oldest.map((o) => o.id) } },
    });
  }
}

/** Sync wrapper for routes that haven't migrated to async yet */
export function getActivityLogSync(): ActivityLogEntry[] {
  return [];
}
