import { NextResponse } from "next/server";
import { listPriorities, savePriorities } from "../../../lib/devroom/persistence";

export async function GET() {
  const priorities = await listPriorities();
  return NextResponse.json({ priorities });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const priorities = body.priorities as Array<{ id: string; text: string; done: boolean }>;
  if (!Array.isArray(priorities)) {
    return NextResponse.json({ error: "priorities array required" }, { status: 400 });
  }
  await savePriorities(priorities);
  return NextResponse.json({ ok: true });
}
