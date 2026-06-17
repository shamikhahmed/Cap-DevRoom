import { NextResponse } from "next/server";
import { resetServerApprovals } from "../../../../lib/devroom/store";

export async function POST() {
  const approvals = await resetServerApprovals();
  return NextResponse.json({ approvals });
}
