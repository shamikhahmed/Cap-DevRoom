import { NextResponse } from "next/server";
import {
  DEVROOM_AGENT_ORG,
  DEVROOM_AGENT_ORG_ORDERED,
  FOUNDER_LABEL,
  type DevroomAgentCodename,
} from "@cap/devroom-shared";
import { getAgentLiveStatuses } from "../../../../lib/devroom/agent-status";
import { aggregateSalaryByAgent, recentJobsByAgent } from "../../../../lib/devroom/jobs";
import { getAgentMemory } from "../../../../lib/devroom/memory";

function reportsToLabel(reportsTo: string): string {
  if (reportsTo === "FOUNDER") return FOUNDER_LABEL;
  const org = DEVROOM_AGENT_ORG[reportsTo as DevroomAgentCodename];
  return org ? `${org.name} (${reportsTo})` : reportsTo;
}

export async function GET() {
  const [statuses, salaries] = await Promise.all([
    getAgentLiveStatuses(),
    aggregateSalaryByAgent(),
  ]);

  const roster = await Promise.all(
    DEVROOM_AGENT_ORG_ORDERED.map(async (profile) => {
      const code = profile.codename;
      const salary = salaries[code] ?? { tokens: 0, cost: 0, runs: 0, lastRunAt: null };
      const jobs = await recentJobsByAgent(code, 5);
      const memory = await getAgentMemory(code);

      return {
        codename: code,
        name: profile.name,
        jobTitle: profile.jobTitle,
        jobDescription: profile.jobDescription,
        department: profile.department,
        reportsTo: profile.reportsTo,
        reportsToLabel: reportsToLabel(profile.reportsTo),
        skills: profile.skills,
        defaultRisk: profile.defaultRisk,
        salary: {
          tokens: salary.tokens,
          cost: salary.cost,
          runs: salary.runs,
        },
        lastRunAt: salary.lastRunAt,
        liveStatus: statuses[code] ?? "standby",
        recentJobs: jobs.map((j: { id: string; task: string; status: string; projectId: string; tokensUsed: number; createdAt: string }) => ({
          id: j.id,
          task: j.task.slice(0, 80),
          status: j.status,
          projectId: j.projectId,
          tokensUsed: j.tokensUsed,
          createdAt: j.createdAt,
        })),
        workMemory: memory.slice(0, 5),
      };
    })
  );

  return NextResponse.json({ roster });
}
