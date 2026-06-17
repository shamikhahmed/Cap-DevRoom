import { ensureDbReady, prisma } from "./db";

export interface ServerPriority {
  id: string;
  text: string;
  done: boolean;
}

export async function listPriorities(): Promise<ServerPriority[]> {
  await ensureDbReady();
  const rows = await prisma.priority.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((r) => ({ id: r.id, text: r.text, done: r.done }));
}

export async function savePriorities(items: ServerPriority[]) {
  await ensureDbReady();
  await prisma.$transaction([
    prisma.priority.deleteMany(),
    ...items.map((p, i) =>
      prisma.priority.create({
        data: { id: p.id, text: p.text, done: p.done, sortOrder: i },
      })
    ),
  ]);
}

export async function togglePriority(id: string, done: boolean) {
  await ensureDbReady();
  await prisma.priority.update({ where: { id }, data: { done } });
}

export interface ServerTask {
  id: string;
  description: string;
  agent: string;
  priority: string;
  risk: string;
  status: "pending" | "in_progress" | "done";
  createdAt: string;
  completedAt?: string;
}

export async function listTasks(): Promise<ServerTask[]> {
  await ensureDbReady();
  const rows = await prisma.task.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((r) => ({
    id: r.id,
    description: r.description,
    agent: r.agent,
    priority: r.priority,
    risk: r.risk,
    status: r.status as ServerTask["status"],
    createdAt: r.createdAt.toISOString(),
    completedAt: r.completedAt?.toISOString(),
  }));
}

export async function upsertTask(task: Omit<ServerTask, "createdAt"> & { createdAt?: string }) {
  await ensureDbReady();
  const row = await prisma.task.upsert({
    where: { id: task.id },
    create: {
      id: task.id,
      description: task.description,
      agent: task.agent,
      priority: task.priority,
      risk: task.risk,
      status: task.status,
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
    },
    update: {
      description: task.description,
      agent: task.agent,
      priority: task.priority,
      risk: task.risk,
      status: task.status,
      completedAt: task.completedAt ? new Date(task.completedAt) : null,
    },
  });
  return row;
}

export async function deleteTask(id: string) {
  await ensureDbReady();
  await prisma.task.delete({ where: { id } });
}

export async function saveBriefing(dateKey: string, content: string, source = "ai") {
  await ensureDbReady();
  await prisma.briefing.upsert({
    where: { dateKey },
    create: { dateKey, content, source },
    update: { content, source },
  });
}

export async function getBriefing(dateKey: string) {
  await ensureDbReady();
  return prisma.briefing.findUnique({ where: { dateKey } });
}

export async function listBriefings(limit = 14) {
  await ensureDbReady();
  return prisma.briefing.findMany({
    orderBy: { dateKey: "desc" },
    take: limit,
  });
}
