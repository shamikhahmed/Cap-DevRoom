import { NextResponse } from "next/server";

/** GitHub cloud setup removed — local sandbox only. */
export async function GET() {
  return NextResponse.json(
    { error: "Cloud agents disabled", checklist: [], repos: {} },
    { status: 410 }
  );
}
