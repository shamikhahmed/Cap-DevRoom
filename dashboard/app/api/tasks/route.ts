import { NextResponse } from "next/server";
import { deleteTask, listTasks, upsertTask } from "../../../lib/devroom/persistence";

export async function GET() {
  const tasks = await listTasks();
  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const body = await req.json();
  const task = body.task;
  if (!task?.description) {
    return NextResponse.json({ error: "task.description required" }, { status: 400 });
  }
  const saved = await upsertTask({
    id: task.id || `task-${Date.now()}`,
    description: task.description,
    agent: task.agent || "APEX",
    priority: task.priority || "NORMAL",
    risk: task.risk || "Low",
    status: task.status || "pending",
    completedAt: task.completedAt,
  });
  return NextResponse.json({ task: saved });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteTask(id);
  return NextResponse.json({ ok: true });
}
