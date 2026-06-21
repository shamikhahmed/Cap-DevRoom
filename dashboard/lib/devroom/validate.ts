import type { RiskTier } from "../../app/lib/data";

/** Dependency-free validation for LLM-produced CEO command JSON. Replaces the
 * fragile "regex-grab-first-brace then JSON.parse and hope" path. */

export interface ValidatedAssignment {
  agent: string;
  task: string;
  project: string;
  risk: RiskTier;
  reason: string;
}

export interface ValidatedCeoResponse {
  greeting: string;
  message: string;
  assignments: ValidatedAssignment[];
}

const RISKS: RiskTier[] = ["Low", "Medium", "High"];

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function coerceRisk(v: unknown): RiskTier {
  const s = asString(v);
  const hit = RISKS.find((r) => r.toLowerCase() === s.toLowerCase());
  return hit ?? "Low";
}

/** Returns null when the payload is unusable (caller should retry/fallback). */
export function parseCeoResponse(raw: string, fallbackProject: string): ValidatedCeoResponse | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;

  let obj: unknown;
  try {
    obj = JSON.parse(match[0]);
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;

  const o = obj as Record<string, unknown>;
  const rawAssignments = Array.isArray(o.assignments) ? o.assignments : [];

  const assignments: ValidatedAssignment[] = [];
  for (const a of rawAssignments) {
    if (typeof a !== "object" || a === null) continue;
    const ao = a as Record<string, unknown>;
    const agent = asString(ao.agent).toUpperCase();
    const task = asString(ao.task);
    if (!agent || !task) continue; // skip malformed rows, keep valid ones
    assignments.push({
      agent,
      task,
      project: asString(ao.project) || fallbackProject,
      risk: coerceRisk(ao.risk),
      reason: asString(ao.reason),
    });
  }

  const greeting = asString(o.greeting);
  const message = asString(o.message);
  // A response with neither a message nor any assignment is useless.
  if (!message && assignments.length === 0) return null;

  return { greeting, message, assignments };
}
