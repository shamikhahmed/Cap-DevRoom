import { NextResponse } from "next/server";
import { deleteIssue, getIssue, updateIssue } from "../../../../lib/devroom/issues";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const issue = await getIssue(id);
  if (!issue) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ issue });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  try {
    const issue = await updateIssue(id, body);
    return NextResponse.json({ issue });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    await deleteIssue(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
