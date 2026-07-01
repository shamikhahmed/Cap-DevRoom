import { NextResponse } from "next/server";
import { diffSandbox, promoteSandboxToProjects, discardSandboxChanges } from "../../../lib/devroom/promote";
import { appendActivity } from "../../../lib/devroom/store";
import { audit } from "../../../lib/devroom/audit";

export async function GET(req: Request) {
  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }
  return NextResponse.json(diffSandbox(projectId));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "apply");
  const projectId = String(body.projectId || "");
  const confirm = Boolean(body.confirm);

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  if (process.env.DEVROOM_PROMOTE === "0") {
    return NextResponse.json({ error: "Promotion disabled (DEVROOM_PROMOTE=0)" }, { status: 403 });
  }

  if (action === "discard") {
    if (!confirm) {
      return NextResponse.json({ error: "confirm: true required" }, { status: 400 });
    }
    await discardSandboxChanges(projectId);
    await appendActivity({
      agent: "FORGE",
      action: `Discarded sandbox changes for ${projectId}`,
      type: "warning",
      projectId,
    });
    return NextResponse.json({ ok: true, action: "discarded" });
  }

  if (action === "apply") {
    if (!confirm) {
      return NextResponse.json({ error: "confirm: true required to promote to ~/Desktop/Projects" }, { status: 400 });
    }
    const diff = diffSandbox(projectId);
    if (diff.count === 0) {
      return NextResponse.json({ ok: true, copied: 0, message: "No changes to promote" });
    }
    const result = await promoteSandboxToProjects(projectId);
    await appendActivity({
      agent: "FORGE",
      action: `Promoted ${result.copied} file(s) to Projects for ${projectId}`,
      type: "success",
      projectId,
    });
    await audit({ action: "promote.apply", target: projectId, detail: `${result.copied} files` });
    return NextResponse.json({ ok: true, ...result });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
