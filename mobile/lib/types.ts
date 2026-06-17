export type RiskTier = "Low" | "Medium" | "High";

export interface HealthResponse {
  ok: boolean;
  cursorApi: string;
  database: string;
  sandboxes: { id: string; path: string; exists: boolean }[];
  sandboxSync: { lastSyncAt: string; stale: boolean; staleDays: number; daysSinceSync: number };
  pendingApprovals: number;
  version: string;
}

export interface Approval {
  id: string;
  title: string;
  description: string;
  agent: string;
  projectId: string;
  risk: RiskTier;
  status: "pending" | "approved" | "rejected";
  task?: string;
  createdAt?: string;
}

export interface AgentRosterEntry {
  codename: string;
  name: string;
  jobTitle: string;
  department: string;
  liveStatus: string;
  salary: { tokens: number; cost: number; runs: number };
}

export interface NetworkInfo {
  port: number;
  localhost: string;
  lan: string | null;
  allLan: string[];
  phoneReady: boolean;
}

export interface Priority {
  id: string;
  text: string;
  done: boolean;
}
