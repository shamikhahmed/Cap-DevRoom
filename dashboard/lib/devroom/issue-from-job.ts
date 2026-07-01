import { createIssue } from "./issues";
import { ensureDbReady, prisma } from "./db";
import { notifyMarkroomHandoffComplete } from "./markroom-webhook";

const ISSUE_LINE = /^\s*ISSUE:\s*(.+)$/im;
const BUG_PATTERNS = [
  /\bCRITICAL\b[:\s-]+(.{10,120})/i,
  /\bBUG\b[:\s-]+(.{10,120})/i,
  /\bHIGH\b[:\s]+(?:severity[:\s]+)?(.{10,120})/i,
];

export async function createIssuesFromJobOutput(
  jobId: string,
  codename: string,
  projectId: string,
  output: string
): Promise<string[]> {
  const created: string[] = [];
  const seen = new Set<string>();

  for (const line of output.split("\n")) {
    const m = line.match(ISSUE_LINE);
    if (!m) continue;
    const title = m[1].trim().slice(0, 200);
    if (!title || seen.has(title.toLowerCase())) continue;
    seen.add(title.toLowerCase());
    const issue = await createIssue({
      title,
      body: `Auto-filed from ${codename} job ${jobId}`,
      projectId,
      type: "task",
      agent: codename,
      status: "backlog",
    });
    await prisma.issue.update({ where: { id: issue.id }, data: { jobId } });
    created.push(issue.key);
  }

  if (created.length === 0) {
    for (const pat of BUG_PATTERNS) {
      const m = output.match(pat);
      if (!m) continue;
      const title = m[1].trim().slice(0, 200);
      if (!title || seen.has(title.toLowerCase())) continue;
      seen.add(title.toLowerCase());
      const issue = await createIssue({
        title,
        body: `Auto-detected from ${codename} output`,
        projectId,
        type: "bug",
        priority: "high",
        agent: codename,
        status: "backlog",
      });
      await prisma.issue.update({ where: { id: issue.id }, data: { jobId } });
      created.push(issue.key);
      break;
    }
  }

  return created;
}

/** When an issue linked to a handoff is marked done, notify Markroom. */
export async function onIssueCompleted(issueId: string): Promise<void> {
  await ensureDbReady();
  const issue = await prisma.issue.findUnique({ where: { id: issueId } });
  if (!issue || issue.status !== "done") return;

  const handoff = await prisma.handoff.findFirst({
    where: { issueId },
  });
  if (!handoff) return;

  await prisma.handoff.update({
    where: { id: handoff.id },
    data: { status: "done" },
  });

  await notifyMarkroomHandoffComplete({
    handoffId: handoff.id,
    issueId: issue.id,
    issueKey: issue.key,
    projectId: issue.projectId,
    status: "done",
    prUrl: issue.prUrl ?? undefined,
  });
}
