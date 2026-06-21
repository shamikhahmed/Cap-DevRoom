import { NextResponse } from "next/server";
import { createIssue, listIssues, type IssueStatus } from "../../../lib/devroom/issues";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") || undefined;
  const status = (url.searchParams.get("status") as IssueStatus | null) || undefined;
  const agent = url.searchParams.get("agent") || undefined;
  const issues = await listIssues({ projectId, status, agent });
  return NextResponse.json({ issues });
}

export async function POST(req: Request) {
  const body = await req.json();
  const title = String(body.title || "").trim();
  const projectId = String(body.projectId || "").trim();
  if (!title || !projectId) {
    return NextResponse.json({ error: "title and projectId required" }, { status: 400 });
  }
  const issue = await createIssue({
    title,
    projectId,
    body: body.body,
    status: body.status,
    priority: body.priority,
    type: body.type,
    agent: body.agent,
    labels: Array.isArray(body.labels) ? body.labels : undefined,
  });
  return NextResponse.json({ issue }, { status: 201 });
}
