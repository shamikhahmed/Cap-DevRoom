import { NextResponse } from "next/server";
import { listAudit } from "../../../lib/devroom/audit";

export async function GET() {
  const entries = await listAudit(100);
  return NextResponse.json({ entries });
}
