import { NextResponse } from "next/server";
import { getAgentCurrentTasks } from "../../../../lib/devroom/agent-tasks";

export async function GET() {
  const tasks = await getAgentCurrentTasks();
  return NextResponse.json({ tasks });
}
