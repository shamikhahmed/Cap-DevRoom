import { NextResponse } from "next/server";
import {
  createScheduled,
  deleteScheduled,
  listScheduled,
  runDue,
  runScheduled,
  updateScheduled,
} from "../../../lib/devroom/scheduled";
import { checkRateLimit } from "../../../lib/devroom/rate-limit";

export async function GET(req: Request) {
  const action = new URL(req.url).searchParams.get("action");
  if (action === "run-due") {
    const limited = checkRateLimit(req, "scheduled/run-due", { limit: 4, windowMs: 60_000 });
    if (limited) return limited;
    return NextResponse.json(await runDue());
  }
  return NextResponse.json({ schedules: await listScheduled() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const action = String(body.action || "create");

  if (action === "run") {
    const limited = checkRateLimit(req, "scheduled/run", { limit: 10, windowMs: 60_000 });
    if (limited) return limited;
    const result = await runScheduled(String(body.id));
    return NextResponse.json({ result });
  }

  const name = String(body.name || "").trim();
  const codename = String(body.codename || "").trim();
  const task = String(body.task || "").trim();
  if (!name || !codename || !task) {
    return NextResponse.json({ error: "name, codename, task required" }, { status: 400 });
  }
  const schedule = await createScheduled({
    name,
    codename,
    task,
    projectId: body.projectId,
    cadence: body.cadence,
    mode: body.mode,
  });
  return NextResponse.json({ schedule }, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { id: _omit, ...patch } = body;
  const schedule = await updateScheduled(id, patch);
  return NextResponse.json({ schedule });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteScheduled(id);
  return NextResponse.json({ ok: true });
}
