import { NextResponse } from "next/server";
import { execReportData, generateExecReport } from "../../../lib/devroom/exec-report";
import { checkRateLimit } from "../../../lib/devroom/rate-limit";

export async function GET() {
  return NextResponse.json(await execReportData());
}

export async function POST(req: Request) {
  const limited = checkRateLimit(req, "exec-report", { limit: 6, windowMs: 60_000 });
  if (limited) return limited;
  try {
    return NextResponse.json(await generateExecReport());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Report failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
