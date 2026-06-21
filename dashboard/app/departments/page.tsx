"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";
import { AGENTS, DEPARTMENTS, type Department } from "../lib/data";
import { useToast } from "../components/Toast";

interface AgentJob {
  codename: string;
  status: string;
  task: string;
}

const STATUS_DOT: Record<string, string> = {
  active: "var(--accent-green)",
  idle: "var(--accent-amber)",
  standby: "var(--text-muted)",
};

const MODEL_BADGE: Record<string, string> = {
  opus: "#bc8cff",
  sonnet: "var(--accent-cyan)",
  haiku: "var(--accent-green)",
};

export default function DepartmentsPage() {
  const { toast } = useToast();
  const [activeJobs, setActiveJobs] = useState<Record<string, AgentJob>>({});
  const [selectedDept, setSelectedDept] = useState<Department | "all">("all");
  const [secSummary, setSecSummary] = useState<{ avgScore: number; criticalCount: number } | null>(null);

  const loadJobs = useCallback(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d: { jobs?: AgentJob[] }) => {
        const map: Record<string, AgentJob> = {};
        for (const job of d.jobs ?? []) {
          if (job.status === "PENDING" || job.status === "PROCESSING") {
            map[job.codename.toUpperCase()] = job;
          }
        }
        setActiveJobs(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadJobs();
    const t = setInterval(loadJobs, 10_000);
    fetch("/api/security").then((r) => r.json()).then((d) => setSecSummary(d)).catch(() => {});
    return () => clearInterval(t);
  }, [loadJobs]);

  async function runDeptScan(dept: Department) {
    toast({ title: `Running ${dept} office scan…` });
    const agents = AGENTS.filter((a) => a.department === dept);
    toast({ kind: "success", title: `${dept} office`, detail: `${agents.length} agents standing by` });
  }

  const depts = selectedDept === "all" ? DEPARTMENTS : DEPARTMENTS.filter((d) => d.id === selectedDept);
  const totalActive = Object.keys(activeJobs).length;

  return (
    <AppShell>
      <div className="mo-page" style={{ maxWidth: 1100 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="mo-eyebrow">Autonomous CTO Office</div>
            <h1 className="mo-title">Departments</h1>
            <p className="t-subhead" style={{ marginTop: 6 }}>
              {AGENTS.length} agents across {DEPARTMENTS.length} offices · {totalActive} active now
              {secSummary && <> · Security avg {secSummary.avgScore}%{secSummary.criticalCount > 0 && <span style={{ color: "var(--accent-red)" }}> · {secSummary.criticalCount} critical</span>}</>}
            </p>
          </div>
          <Link href="/agents" className="mo-btn" style={{ textDecoration: "none" }}>All Agents →</Link>
        </div>

        {/* Dept filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          <button onClick={() => setSelectedDept("all")} className="mo-btn" style={{ borderColor: selectedDept === "all" ? "var(--accent)" : undefined, color: selectedDept === "all" ? "var(--text-primary)" : undefined }}>
            All offices
          </button>
          {DEPARTMENTS.map((d) => (
            <button key={d.id} onClick={() => setSelectedDept(d.id)} className="mo-btn"
              style={{ borderColor: selectedDept === d.id ? "var(--accent)" : undefined, color: selectedDept === d.id ? "var(--text-primary)" : undefined }}>
              {d.icon} {d.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {depts.map((dept) => {
            const deptAgents = AGENTS.filter((a) => a.department === dept.id);
            const deptActive = deptAgents.filter((a) => activeJobs[a.codename]).length;
            const headAgent = AGENTS.find((a) => a.codename === dept.head);

            return (
              <div key={dept.id} className="mo-card" style={{ overflow: "hidden" }}>
                {/* Dept header */}
                <div style={{ padding: "16px 20px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 28, lineHeight: 1 }}>{dept.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="t-title3" style={{ color: "var(--text-primary)" }}>{dept.label}</span>
                      {deptActive > 0 && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, backgroundColor: "rgba(92,184,138,0.15)", color: "var(--accent-green)", fontWeight: 700 }}>
                        {deptActive} ACTIVE
                      </span>}
                    </div>
                    <div className="t-footnote" style={{ marginTop: 2 }}>{dept.description}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div className="t-caption" style={{ textAlign: "right" }}>
                      <div style={{ color: "var(--text-muted)" }}>Head</div>
                      <div style={{ color: "var(--accent)" }}>{dept.head}</div>
                    </div>
                    <button className="mo-btn" style={{ padding: "6px 12px" }} onClick={() => runDeptScan(dept.id)}>
                      Brief office
                    </button>
                  </div>
                </div>

                {/* Agents grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 1, backgroundColor: "var(--border)" }}>
                  {deptAgents.map((agent) => {
                    const job = activeJobs[agent.codename];
                    const isActive = !!job;
                    return (
                      <Link
                        key={agent.codename}
                        href={`/agents/${agent.codename.toLowerCase()}`}
                        style={{ textDecoration: "none", backgroundColor: "var(--bg-card)", padding: "14px 16px", display: "block" }}
                        className="card-hover"
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{ marginTop: 3 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: isActive ? "var(--accent-green)" : STATUS_DOT[agent.status] ?? "var(--text-muted)" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                              <span className="t-headline" style={{ color: "var(--accent)", letterSpacing: "0.5px" }}>{agent.codename}</span>
                              {agent.defaultModel && (
                                <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, color: MODEL_BADGE[agent.defaultModel], border: `1px solid ${MODEL_BADGE[agent.defaultModel]}40`, letterSpacing: "0.5px" }}>
                                  {agent.defaultModel}
                                </span>
                              )}
                            </div>
                            <div className="t-footnote" style={{ color: "var(--text-secondary)" }}>{agent.role}</div>
                            {job && (
                              <div className="t-caption" style={{ marginTop: 4, color: "var(--accent-amber)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                ↳ {job.task.slice(0, 50)}…
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 20, marginTop: 24, flexWrap: "wrap" }}>
          {[
            { color: "var(--accent-green)", label: "Active — running a job" },
            { color: "var(--accent-amber)", label: "Idle — available" },
            { color: "var(--text-muted)", label: "Standby — waiting" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: l.color }} />
              <span className="t-caption">{l.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            {["opus", "sonnet", "haiku"].map((m) => (
              <span key={m} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, color: MODEL_BADGE[m], border: `1px solid ${MODEL_BADGE[m]}40` }}>{m}</span>
            ))}
            <span className="t-caption"> — model tier</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
