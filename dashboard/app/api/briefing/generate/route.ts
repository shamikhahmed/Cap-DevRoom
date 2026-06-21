import { NextResponse } from "next/server";
import { generateBriefing } from "../../../../lib/devroom/orchestrator";
import { checkRateLimit } from "../../../../lib/devroom/rate-limit";

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "briefing/generate", { limit: 6, windowMs: 60_000 });
  if (limited) return limited;
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
