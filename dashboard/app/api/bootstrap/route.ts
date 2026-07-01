import { NextResponse } from "next/server";
import { bootstrapOffice } from "../../../lib/devroom/heartbeat";

export async function POST() {
  try {
    const result = await bootstrapOffice();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bootstrap failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
