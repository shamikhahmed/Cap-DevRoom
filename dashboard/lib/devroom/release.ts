import { ensureDbReady, prisma } from "./db";
import { getReadiness } from "./readiness";
import { portfolioScores } from "./priority";
import { listProjects } from "./projects";
import { budgetStatus } from "./budget";

/**
 * Release Management Office. Generates structured approval packages for founder
 * sign-off before any major release. Covers all dimensions: readiness, bugs,
 * open issues, QA status, security, and a go/no-go recommendation.
 */

export interface ReleaseCheckItem {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export interface ReleasePackage {
  projectId: string;
  projectName: string;
  version: string;
  generatedAt: string;
  overallScore: number;
  recommendation: "GO" | "CONDITIONAL_GO" | "NO_GO";
  completedWork: string[];
  risks: string[];
  missingItems: string[];
  checks: ReleaseCheckItem[];
  founderApprovalRequired: boolean;
  approvalReason?: string;
}

export async function generateReleasePackage(projectId: string): Promise<ReleasePackage> {
  await ensureDbReady();

  const projects = await listProjects();
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  const readiness = await getReadiness(projectId);
  const scores = await portfolioScores();
  const score = scores.find((s) => s.projectId === projectId);
  const budget = await budgetStatus();

  // Open issues breakdown
  const openIssues = await prisma.issue.findMany({
    where: { projectId, status: { notIn: ["done", "canceled"] } },
    select: { title: true, priority: true, type: true, status: true },
  });
  const openBugs = openIssues.filter((i) => i.type === "bug");
  const urgentBugs = openBugs.filter((i) => i.priority === "urgent" || i.priority === "high");
  const recentJobs = await prisma.agentJob.count({
    where: { projectId, status: "COMPLETED", createdAt: { gte: new Date(Date.now() - 7 * 864e5) } },
  });
  const pendingApprovals = await prisma.approval.count({ where: { status: "pending" } });

  const checks: ReleaseCheckItem[] = [
    {
      label: "Launch readiness score",
      status: readiness.score >= 85 ? "pass" : readiness.score >= 60 ? "warn" : "fail",
      detail: `${readiness.score}% (${readiness.counts.pass} pass, ${readiness.counts.fail} fail, ${readiness.counts.warn} warn)`,
    },
    {
      label: "Critical blockers",
      status: readiness.counts.fail === 0 ? "pass" : "fail",
      detail: readiness.counts.fail === 0 ? "No critical blockers" : `${readiness.counts.fail} blocker(s) must be resolved`,
    },
    {
      label: "Open bugs",
      status: openBugs.length === 0 ? "pass" : urgentBugs.length > 0 ? "fail" : "warn",
      detail: openBugs.length === 0 ? "No open bugs" : `${openBugs.length} open (${urgentBugs.length} urgent/high)`,
    },
    {
      label: "QA validation",
      status: readiness.counts.fail === 0 && openBugs.length === 0 ? "pass" : openBugs.length > 3 ? "fail" : "warn",
      detail: recentJobs > 0 ? `${recentJobs} agent runs completed this week` : "No QA agent runs in the last 7 days",
    },
    {
      label: "Pending approvals",
      status: pendingApprovals === 0 ? "pass" : pendingApprovals > 3 ? "fail" : "warn",
      detail: pendingApprovals === 0 ? "Approval queue cleared" : `${pendingApprovals} pending approval(s)`,
    },
    {
      label: "Budget status",
      status: Math.round((budget.costUsd / budget.capUsd) * 100) < 80 ? "pass" : Math.round((budget.costUsd / budget.capUsd) * 100) < 100 ? "warn" : "fail",
      detail: `$${budget.costUsd.toFixed(2)} of $${budget.capUsd} used today (${Math.round((budget.costUsd / budget.capUsd) * 100)}%)`,
    },
  ];

  const completedWork: string[] = [];
  const risks: string[] = [];
  const missingItems: string[] = [];

  if (readiness.counts.pass > 0) completedWork.push(`${readiness.counts.pass} readiness checks passing`);
  if (recentJobs > 0) completedWork.push(`${recentJobs} agent operations completed this week`);
  if (openBugs.length === 0) completedWork.push("All known bugs resolved");

  if (urgentBugs.length > 0) risks.push(`${urgentBugs.length} urgent/high-priority bug(s) still open`);
  if (readiness.counts.fail > 0) risks.push(`${readiness.counts.fail} launch readiness blocker(s) unresolved`);
  if (Math.round((budget.costUsd / budget.capUsd) * 100) >= 80) risks.push(`AI budget at ${Math.round((budget.costUsd / budget.capUsd) * 100)}% — limited runway for pre-launch agent work`);

  if (readiness.counts.pending > 0) missingItems.push(`${readiness.counts.pending} readiness checks not yet run`);
  if (openBugs.length > 0) missingItems.push(`${openBugs.length} bug(s) should be resolved before launch`);

  const overallScore = Math.round(
    readiness.score * 0.5 +
    (openBugs.length === 0 ? 100 : Math.max(0, 100 - openBugs.length * 15)) * 0.3 +
    (urgentBugs.length === 0 ? 100 : 0) * 0.2
  );

  const failCount = checks.filter((c) => c.status === "fail").length;
  const recommendation: "GO" | "CONDITIONAL_GO" | "NO_GO" =
    failCount === 0 && overallScore >= 80 ? "GO" :
    failCount <= 1 && overallScore >= 60 ? "CONDITIONAL_GO" : "NO_GO";

  const founderApprovalRequired = recommendation !== "GO" || urgentBugs.length > 0;
  const approvalReason =
    recommendation === "NO_GO" ? "Critical issues must be resolved before release." :
    recommendation === "CONDITIONAL_GO" ? "Minor issues remain. Founder approval required to proceed." :
    undefined;

  // Try to extract version from readiness data
  const version = project.stack?.match(/v\d+\.\d+\.\d+/)?.[0] ?? "latest";

  return {
    projectId,
    projectName: project.name,
    version,
    generatedAt: new Date().toISOString(),
    overallScore,
    recommendation,
    completedWork,
    risks,
    missingItems,
    checks,
    founderApprovalRequired,
    approvalReason,
  };
}

export async function generateAllReleasePackages(): Promise<ReleasePackage[]> {
  const projects = await listProjects();
  return Promise.all(projects.filter((p) => p.status === "active").map((p) => generateReleasePackage(p.id)));
}
