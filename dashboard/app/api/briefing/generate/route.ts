import { NextResponse } from "next/server";
import { generateBriefing } from "../../../../lib/devroom/orchestrator";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const projectId = String((body as { projectId?: string }).projectId || "VaultCap");
    const text = await generateBriefing(projectId);
    return NextResponse.json({ ok: true, briefing: text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Briefing failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
