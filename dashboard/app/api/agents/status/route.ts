import { NextResponse } from "next/server";
import { getAgentStatusMap } from "../../../../lib/devroom/agent-status";

export async function GET() {
  const map = await getAgentStatusMap();
  const statuses: Record<string, string> = {};
  const currentTasks: Record<string, string> = {};
  for (const [code, info] of Object.entries(map)) {
    statuses[code] = info.status;
    if (info.currentTask) currentTasks[code] = info.currentTask;
  }
  return NextResponse.json({ statuses, currentTasks });
}
