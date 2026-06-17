import { NextResponse } from "next/server";
import { getBriefing, listBriefings, saveBriefing } from "../../../lib/devroom/persistence";
import { generateBriefing } from "../../../lib/devroom/orchestrator";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateKey = searchParams.get("date");
  if (dateKey) {
    const row = await getBriefing(dateKey);
    return NextResponse.json({ briefing: row });
  }
  const briefings = await listBriefings();
  return NextResponse.json({ briefings });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const projectId = String((body as { projectId?: string }).projectId || "VaultCap");
    const mode = String((body as { mode?: string }).mode || "ai");
    const dateKey = new Date().toISOString().split("T")[0];

    let content: string;
    let source = mode;

    if (mode === "rules" && typeof (body as { content?: string }).content === "string") {
      content = (body as { content: string }).content;
      source = "rules";
    } else {
      content = await generateBriefing(projectId);
      source = "ai";
    }

    await saveBriefing(dateKey, content, source);
    return NextResponse.json({ ok: true, briefing: content, dateKey, source });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Briefing failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
