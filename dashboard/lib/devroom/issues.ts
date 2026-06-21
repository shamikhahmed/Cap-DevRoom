import { ensureDbReady, prisma } from "./db";
import { normalizeProjectId } from "./portfolio";

/** Linear/Jira-style issue tracker — the engineering workflow spine. */

export type IssueStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done" | "canceled";
export type IssuePriority = "urgent" | "high" | "medium" | "low" | "none";
export type IssueType = "bug" | "feature" | "task" | "chore";

export const ISSUE_STATUSES: IssueStatus[] = ["backlog", "todo", "in_progress", "in_review", "done", "canceled"];
export const ISSUE_PRIORITIES: IssuePriority[] = ["urgent", "high", "medium", "low", "none"];
export const ISSUE_TYPES: IssueType[] = ["bug", "feature", "task", "chore"];

function keyPrefix(projectId: string): string {
  const base = projectId.replace(/[^A-Za-z0-9]/g, "").replace(/Cap$/i, "");
  return (base || "ISS").toUpperCase().slice(0, 5);
}

export interface CreateIssueInput {
  title: string;
  body?: string;
  projectId: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  type?: IssueType;
  agent?: string;
  labels?: string[];
}

export async function createIssue(input: CreateIssueInput) {
  await ensureDbReady();
  const projectId = normalizeProjectId(input.projectId);
  const n = (await prisma.issue.count({ where: { projectId } })) + 1;
  const key = `${keyPrefix(projectId)}-${n}`;
  return prisma.issue.create({
    data: {
      key,
      title: input.title.slice(0, 200),
      body: input.body ?? "",
      projectId,
      status: input.status ?? "backlog",
      priority: input.priority ?? "medium",
      type: input.type ?? "task",
      agent: input.agent,
      labels: JSON.stringify(input.labels ?? []),
    },
  });
}

export async function listIssues(filter?: { projectId?: string; status?: IssueStatus; agent?: string }) {
  await ensureDbReady();
  return prisma.issue.findMany({
    where: {
      ...(filter?.projectId ? { projectId: normalizeProjectId(filter.projectId) } : {}),
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.agent ? { agent: filter.agent.toUpperCase() } : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function updateIssue(
  id: string,
  patch: Partial<{
    title: string;
    body: string;
    status: IssueStatus;
    priority: IssuePriority;
    type: IssueType;
    agent: string | null;
    labels: string[];
    jobId: string | null;
    prUrl: string | null;
  }>
) {
  await ensureDbReady();
  const { labels, ...rest } = patch;
  return prisma.issue.update({
    where: { id },
    data: { ...rest, ...(labels ? { labels: JSON.stringify(labels) } : {}) },
  });
}

export async function getIssue(id: string) {
  await ensureDbReady();
  return prisma.issue.findUnique({ where: { id } });
}

export async function deleteIssue(id: string) {
  await ensureDbReady();
  await prisma.issue.delete({ where: { id } });
}
