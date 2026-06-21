import { ensureDbReady, prisma } from "./db";

/** Immutable audit trail for sensitive actions (approvals, budget hits, etc). */

export async function audit(entry: {
  actor?: string;
  action: string;
  target?: string;
  detail?: string;
  ip?: string;
}): Promise<void> {
  await ensureDbReady();
  await prisma.auditLog.create({
    data: {
      actor: entry.actor || "founder",
      action: entry.action,
      target: entry.target,
      detail: entry.detail?.slice(0, 500),
      ip: entry.ip,
    },
  });
}

export async function listAudit(limit = 100) {
  await ensureDbReady();
  return prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}
