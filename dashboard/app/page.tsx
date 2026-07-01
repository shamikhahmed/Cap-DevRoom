"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "./components/AppShell";
import CeoCommand from "./components/CeoCommand";
import GreetingBanner from "./components/GreetingBanner";
import PortfolioPulse from "./components/PortfolioPulse";
import AgentJobProgress from "./components/AgentJobProgress";
import {
  AGENTS,
  DEPARTMENTS,
  initStorage,
  computePortfolioMetrics,
  type AgentStatus,
} from "./lib/data";
import CriticalAlerts from "./components/CriticalAlerts";
import { syncFromServer } from "./lib/server-sync";
import { storageKey } from "./lib/brand";

/* ── Types ─────────────────────────────────────────────────── */

type LogType = "info" | "warning" | "critical" | "success";

interface LogEntry {
  id: string | number;
  time: string;
  agent: string;
  action: string;
  type: LogType;
}

function formatLogTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const EMPTY_METRICS: {
  activeProjects: number;
  totalProjects: number;
  openBugs: number;
  pendingApprovals: number;
  activeAgents: number;
} = {
  activeProjects: 0,
  totalProjects: 0,
  openBugs: 0,
  pendingApprovals: 0,
  activeAgents: 0,
};

const LOG_COLORS: Record<LogType, string> = {
  info:     "var(--text-secondary)",
  warning:  "var(--accent-amber)",
  critical: "var(--accent-red)",
  success:  "var(--accent-green)",
};

const LOG_LABELS: Record<LogType, string> = {
  info:     "INFO",
  warning:  "WARN",
  critical: "CRIT",
  success:  "OK",
};

/* ── Agent accent colors ───────────────────────────────────── */

const AGENT_ACCENT: Record<string, string> = {
  APEX:   "var(--accent-cyan)",
  FORGE:  "var(--accent-amber)",
  PRISM:  "#bc8cff",
  PIXEL:  "var(--accent-cyan)",
  CORE:   "var(--accent-green)",
  SHIELD: "var(--accent-amber)",
  VAULT:  "var(--accent-red)",
  LENS:   "var(--accent-cyan)",
  SCROLL: "var(--text-secondary)",
  INK:    "#bc8cff",
};

interface SystemStatus {
  tasksPending: number;
  lastBriefing: string;
  optimal: number;
  degraded: number;
  knowledgeDocs: number;
}

/* ── Metric card ───────────────────────────────────────────── */

const EMPTY_SYS_STATUS: SystemStatus = {
  tasksPending: 0,
  lastBriefing: "None",
  optimal: 0,
  degraded: 0,
  knowledgeDocs: 0,
};

function MetricCard({
  label,
  value,
  accentColor,
  sub,
  href,
}: {
  label: string;
  value: number | string;
  accentColor: string;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <div style={{ padding: "18px 20px" }}>
      <div
        className="font-heading count-animate"
        style={{ fontSize: 32, color: accentColor, lineHeight: 1, marginBottom: 8 }}
        suppressHydrationWarning
      >
        {value}
      </div>
      <div className="mo-section-label">{label}</div>
      {sub && (
        <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px" }}>
          {sub}
        </div>
      )}
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="mo-card card-hover" style={{ overflow: "hidden", display: "block", textDecoration: "none" }}>
        {inner}
      </Link>
    );
  }
  return <div className="mo-card card-hover" style={{ overflow: "hidden" }}>{inner}</div>;
}

/* ── Agent mini-card ───────────────────────────────────────── */

interface AgentJob {
  id: string;
  codename: string;
  task: string;
  status: string;
}

function AgentMiniCard({
  agent,
  liveStatus,
  activeJob,
}: {
  agent: (typeof AGENTS)[0];
  liveStatus?: AgentStatus;
  activeJob?: AgentJob;
}) {
  const status = liveStatus ?? agent.status;
  const accent = AGENT_ACCENT[agent.codename] ?? "var(--accent-cyan)";
  const isActive = status === "active";
  const isIdle = status === "idle";

  return (
    <Link
      href={`/agents/${agent.codename.toLowerCase()}`}
      className={`card-hover agent-border-${status} mo-agent-mini-link`}
      style={{
        backgroundColor: "var(--bg-card)",
        border: `1px solid ${isActive ? "rgba(212,168,83,0.3)" : "var(--border)"}`,
        borderRadius: "var(--radius-sm)",
        padding: "14px 16px",
        position: "relative",
        textDecoration: "none",
        display: "block",
      }}
    >
      {/* Status corner dot */}
      <div
        className={isActive ? "dot-pulse" : undefined}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: isActive
            ? "var(--accent-green)"
            : isIdle
            ? "var(--accent-amber)"
            : "var(--text-muted)",
          boxShadow: isActive ? "0 0 6px var(--accent-green)" : undefined,
        }}
      />

      <div
        className="font-heading"
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: accent,
          letterSpacing: "1.5px",
          lineHeight: 1.1,
          marginBottom: "3px",
        }}
      >
        {agent.codename}
      </div>
      <div
        style={{
          fontSize: "9px",
          color: "var(--text-muted)",
          letterSpacing: "0.3px",
          lineHeight: 1.3,
        }}
      >
        {agent.name}
      </div>
      <div
        style={{
          marginTop: "6px",
          fontSize: "8px",
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: isActive
            ? "var(--accent-green)"
            : isIdle
            ? "var(--accent-amber)"
            : "var(--text-muted)",
        }}
      >
        {status}
      </div>
      {activeJob && (activeJob.status === "PENDING" || activeJob.status === "PROCESSING") && (
        <AgentJobProgress status={activeJob.status} task={activeJob.task} compact />
      )}
    </Link>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default function CommandCenter() {
  const router = useRouter();
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [sysStatus, setSysStatus] = useState<SystemStatus>(EMPTY_SYS_STATUS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [activeJobs, setActiveJobs] = useState<Record<string, AgentJob>>({});
  const [healthMeta, setHealthMeta] = useState<{
    lastActivityAt: string | null;
    sandboxStale: boolean;
    daysSinceSync: number | null;
    unpromotedTotal: number;
  }>({ lastActivityAt: null, sandboxStale: false, daysSinceSync: null, unpromotedTotal: 0 });
  const [scanBusy, setScanBusy] = useState(false);

  const hasLiveActivity =
    logs.length > 0 || Object.values(activeJobs).some((j) => j.status === "PROCESSING");

  function loadActivity() {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((data: { log?: Array<{ id: string; time: string; agent: string; action: string; type: LogType }> }) => {
        const serverLog = data.log ?? [];
        if (serverLog.length === 0) {
          setLogs([]);
          return;
        }
        setLogs(
          serverLog.slice(0, 80).map((entry) => ({
            id: entry.id,
            agent: entry.agent,
            action: entry.action,
            type: entry.type,
            time: formatLogTime(entry.time),
          }))
        );
      })
      .catch(() => setLogs([]));
  }

  async function runReadinessScan() {
    setScanBusy(true);
    try {
      await fetch("/api/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scanAll" }),
      });
      loadActivity();
    } finally {
      setScanBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      initStorage();
      await syncFromServer();

      const m = computePortfolioMetrics();
      if (cancelled) return;

      const prefix = storageKey("briefing");
      const briefingKeys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
      let lastBriefing = "None";
      if (briefingKeys.length > 0) {
        briefingKeys.sort().reverse();
        lastBriefing = briefingKeys[0].replace(prefix, "");
      }

      setSysStatus({
        tasksPending: m.tasksPending,
        lastBriefing,
        optimal: m.optimal,
        degraded: m.degraded,
        knowledgeDocs: m.knowledgeDocs,
      });

      try {
        const h = await fetch("/api/health").then((r) => r.json());
        if (cancelled) return;
        setMetrics({
          activeProjects: h.activeProjects ?? m.activeProjects,
          totalProjects: h.totalProjects ?? m.totalProjects,
          openBugs: h.openBugs ?? m.openBugs,
          pendingApprovals: h.pendingApprovals ?? m.pendingApprovals,
          activeAgents: m.activeAgents,
        });
        setHealthMeta({
          lastActivityAt: h.lastActivityAt ?? null,
          sandboxStale: h.sandboxSync?.stale ?? false,
          daysSinceSync: h.sandboxSync?.daysSinceSync ?? null,
          unpromotedTotal: h.unpromotedTotal ?? 0,
        });
      } catch {
        if (!cancelled) {
          setMetrics({
            activeProjects: m.activeProjects,
            totalProjects: m.totalProjects,
            openBugs: m.openBugs,
            pendingApprovals: m.pendingApprovals,
            activeAgents: m.activeAgents,
          });
        }
      }
    }

    void load();

    loadActivity();
    const interval = setInterval(loadActivity, 15_000);

    const loadAgentStatus = () => {
      fetch("/api/agents/status")
        .then((r) => r.json())
        .then((data: { statuses?: Record<string, AgentStatus> }) => {
          const statuses = data.statuses ?? {};
          setAgentStatuses(statuses);
          const activeCount = AGENTS.filter(
            (a) => (statuses[a.codename] ?? a.status) === "active"
          ).length;
          setMetrics((prev) => ({ ...prev, activeAgents: activeCount }));
        })
        .catch(() => {});
    };
    loadAgentStatus();
    const statusInterval = setInterval(loadAgentStatus, 30_000);

    const loadJobs = () => {
      fetch("/api/jobs")
        .then((r) => r.json())
        .then((data: { jobs?: AgentJob[] }) => {
          const map: Record<string, AgentJob> = {};
          for (const job of data.jobs ?? []) {
            const code = job.codename.toUpperCase();
            if (job.status === "PENDING" || job.status === "PROCESSING") {
              if (!map[code]) map[code] = job;
            }
          }
          setActiveJobs(map);
        })
        .catch(() => {});
    };
    loadJobs();
    const jobsInterval = setInterval(loadJobs, 10_000);

    const healthInterval = setInterval(() => {
      fetch("/api/health")
        .then((r) => r.json())
        .then((h) => {
          if (!cancelled && typeof h.pendingApprovals === "number") {
            setMetrics((prev) => ({ ...prev, pendingApprovals: h.pendingApprovals }));
          }
        })
        .catch(() => {});
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearInterval(statusInterval);
      clearInterval(jobsInterval);
      clearInterval(healthInterval);
    };
  }, []);

  return (
    <AppShell>
      <div className="mo-page" style={{ height: "100%", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div className="mo-eyebrow">Command center</div>
          <h1 className="mo-title">Overview</h1>
        </div>

        <GreetingBanner />
        <CriticalAlerts />
        <PortfolioPulse />
        <CeoCommand />

        {/* Metrics row */}
        <div className="mo-metrics" style={{ flexShrink: 0 }}>
          <MetricCard label="Active Projects"   value={metrics.activeProjects}   accentColor="var(--accent-cyan)"  sub={`of ${metrics.totalProjects} total`} href="/projects" />
          <MetricCard label="Open Bugs"         value={metrics.openBugs}         accentColor="var(--accent-amber)" sub="across portfolio" href="/issues" />
          <MetricCard label="Pending Approvals" value={metrics.pendingApprovals} accentColor={metrics.pendingApprovals > 0 ? "var(--accent-red)" : "var(--accent-green)"} sub={metrics.pendingApprovals > 0 ? "action required" : "queue clear"} href="/approvals" />
          <MetricCard label="Active Agents"     value={metrics.activeAgents}     accentColor="var(--accent-green)" sub={`${AGENTS.length - metrics.activeAgents} standby/idle`} href="/agents" />
        </div>

        {/* Quick actions */}
        <div className="mo-quick-actions" style={{ flexShrink: 0 }}>
          {[
            { label: "Departments", href: "/departments" },
            { label: "Security", href: "/security" },
            { label: "Launch Control", href: "/launch" },
            { label: "Review approvals", href: "/approvals" },
            { label: "Generate briefing", href: "/briefing" },
            { label: "Issues", href: "/issues" },
          ].map((action) => (
            <button
              key={action.href}
              className="quick-action"
              onClick={() => router.push(action.href)}
              style={{ flex: 1 }}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Department status strip */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flexShrink: 0 }}>
          {DEPARTMENTS.map((dept) => {
            const deptAgents = AGENTS.filter((a) => a.department === dept.id);
            const activeCount = deptAgents.filter((a) => activeJobs[a.codename]).length;
            return (
              <button
                key={dept.id}
                className="card-hover"
                onClick={() => router.push("/departments")}
                style={{ flex: "1 1 100px", minWidth: 80, padding: "8px 10px", borderRadius: "var(--radius-sm)", border: `0.5px solid ${activeCount > 0 ? "rgba(92,184,138,0.4)" : "var(--border)"}`, backgroundColor: activeCount > 0 ? "rgba(92,184,138,0.06)" : "var(--bg-card)", cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ fontSize: 14, marginBottom: 2 }}>{dept.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase" }}>{dept.id}</div>
                <div style={{ fontSize: 10, color: activeCount > 0 ? "var(--accent-green)" : "var(--text-secondary)", marginTop: 1 }}>
                  {activeCount > 0 ? `${activeCount} active` : `${deptAgents.length} agents`}
                </div>
              </button>
            );
          })}
        </div>

        {/* System status */}
        <div className="mo-system-status mo-card" style={{ flexShrink: 0, padding: "12px 14px" }}>
          <div className="mo-section-label" style={{ gridColumn: "1 / -1", marginBottom: 4 }}>
            System status
          </div>
          {[
            { label: "Tasks Pending",   value: String(sysStatus.tasksPending),  color: sysStatus.tasksPending > 0 ? "var(--accent-amber)" : "var(--accent-green)" },
            { label: "Last Briefing",   value: sysStatus.lastBriefing,          color: "var(--text-secondary)" },
            { label: "Health",          value: `${sysStatus.optimal} optimal · ${sysStatus.degraded} degraded`, color: sysStatus.degraded > 0 ? "var(--accent-amber)" : "var(--accent-green)" },
            { label: "Knowledge Docs",  value: String(sysStatus.knowledgeDocs), color: "var(--accent-cyan)" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "3px" }}>{s.label}</div>
              <div style={{ fontSize: "11px", color: s.color, fontWeight: "bold", letterSpacing: "0.5px" }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Agent grid + Activity log */}
        <div className="mo-split" style={{ flex: 1, minHeight: 0 }}>
          {/* Agent grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: 0 }}>
            <div className="mo-section-label">
              Agent roster ·{" "}
              {AGENTS.filter((a) => (agentStatuses[a.codename] ?? a.status) === "active").length} active
            </div>
            <div className="mo-agent-grid">
              {AGENTS.map((agent) => (
                <AgentMiniCard
                  key={agent.codename}
                  agent={agent}
                  liveStatus={agentStatuses[agent.codename]}
                  activeJob={activeJobs[agent.codename]}
                />
              ))}
            </div>
          </div>

          {/* Activity log */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              overflow: "hidden",
              minHeight: 0,
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <span
                className={hasLiveActivity ? "status-pulse" : undefined}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: hasLiveActivity ? "var(--accent-green)" : "var(--text-muted)",
                }}
              />
              <span className="mo-section-label" style={{ color: "var(--text-secondary)" }}>
                Activity{hasLiveActivity ? "" : " · idle"}
              </span>
            </div>

            {/* Log entries */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "8px 0",
              }}
            >
              {logs.length === 0 ? (
                <div style={{ padding: "24px 16px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                  <div style={{ marginBottom: 12 }}>No activity yet.</div>
                  {healthMeta.sandboxStale && (
                    <div style={{ marginBottom: 8, color: "var(--accent-amber)" }}>
                      Sandboxes stale{healthMeta.daysSinceSync != null ? ` (${healthMeta.daysSinceSync}d)` : ""} — run npm run sync:sandboxes
                    </div>
                  )}
                  {healthMeta.unpromotedTotal > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      {healthMeta.unpromotedTotal} un-promoted sandbox file(s) — <Link href="/promote" style={{ color: "var(--accent-cyan)" }}>review</Link>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
                    <button type="button" className="mo-btn" disabled={scanBusy} onClick={() => void runReadinessScan()}>
                      {scanBusy ? "Scanning…" : "Scan readiness"}
                    </button>
                    <Link href="/approvals" className="mo-btn" style={{ textDecoration: "none" }}>Approvals</Link>
                  </div>
                </div>
              ) : (
                logs.map((entry) => (
                <div
                  key={entry.id}
                  className="log-entry"
                  style={{
                    padding: "7px 14px",
                    borderBottom: "1px solid rgba(13,42,61,0.5)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <span
                      style={{
                        fontSize: "8px",
                        padding: "1px 4px",
                        borderRadius: "2px",
                        backgroundColor: `${LOG_COLORS[entry.type]}18`,
                        color: LOG_COLORS[entry.type],
                        border: `1px solid ${LOG_COLORS[entry.type]}30`,
                        letterSpacing: "0.5px",
                        flexShrink: 0,
                      }}
                    >
                      {LOG_LABELS[entry.type]}
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        color: "var(--accent-cyan)",
                        fontWeight: "bold",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {entry.agent}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: "9px", color: "var(--text-muted)", flexShrink: 0 }}>
                      {entry.time}
                    </span>
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    {entry.action}
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
