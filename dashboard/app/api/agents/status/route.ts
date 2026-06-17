import { NextResponse } from "next/server";
import { getAgentLiveStatuses } from "../../../../lib/devroom/agent-status";

export async function GET() {
  const statuses = await getAgentLiveStatuses();
  return NextResponse.json({ statuses });
}
