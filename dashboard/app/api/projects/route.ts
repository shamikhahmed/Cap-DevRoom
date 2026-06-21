import { NextResponse } from "next/server";
import { listProjects, updateProject } from "../../../lib/devroom/projects";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const project = await updateProject(id, body.patch ?? {});
    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
