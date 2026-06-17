"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "./components/AppShell";
import CeoCommand from "./components/CeoCommand";
import GreetingBanner from "./components/GreetingBanner";
import AgentJobProgress from "./components/AgentJobProgress";
import {
  AGENTS,
  initStorage,
  computePortfolioMetrics,
  type AgentStatus,
} from "./lib/data";
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

function seedFallbackLogs(): LogEntry[] {
  return [];
}

/* Removed demo log pool — activity log shows real server events only */

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

/* ── Metric card ───────────────────────────────────────────── */

function MetricCard({
  label,
  value,
  accentColor,
  sub,
}: {
  label: string;
  value: number | string;
  accentColor: string;
  sub?: string;
}) {
  return (
    <div className="mo-card card-hover" style={{ overflow: "hidden" }}>
      <div style={{ padding: "18px 20px" }}>
        <div
          className="font-heading count-animate"
          style={{ fontSize: 32, color: accentColor, lineHeight: 1, marginBottom: 8 }}
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
    </div>
  );
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
    <div
      className={`card-hover agent-border-${status}`}
      style={{
        backgroundColor: "var(--bg-card)",
        border: `1px solid ${isActive ? "rgba(212,168,83,0.3)" : "var(--border)"}`,
        borderRadius: "var(--radius-sm)",
        padding: "14px 16px",
        position: "relative",
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
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

interface SystemStatus {
  tasksPending: number;
  lastBriefing: string;
  optimal: number;
  degraded: number;
  knowledgeDocs: number;
}

export default function CommandCenter() {
  const router = useRouter();
  const [metrics, setMetrics] = useState(() => {
    const m = computePortfolioMetrics();
    return {
      activeProjects: m.activeProjects,
      openBugs: m.openBugs,
      pendingApprovals: m.pendingApprovals,
      activeAgents: m.activeAgents,
    };
  });
  const [sysStatus, setSysStatus] = useState<SystemStatus>(() => {
    const m = computePortfolioMetrics();
    return {
      tasksPending: m.tasksPending,
      lastBriefing: "None",
      optimal: m.optimal,
      degraded: m.degraded,
      knowledgeDocs: m.knowledgeDocs,
    };
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [activeJobs, setActiveJobs] = useState<Record<string, AgentJob>>({});
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initStorage();
    syncFromServer().then(() => {
      const m = computePortfolioMetrics();
      setMetrics((prev) => ({
        ...prev,
        pendingApprovals: m.pendingApprovals,
      }));
      setSysStatus((prev) => ({ ...prev, tasksPending: m.tasksPending }));
    });
    const m = computePortfolioMetrics();
    fetch("/api/health")
      .then((r) => r.json())
      .then((h) => {
        setMetrics({
          activeProjects: m.activeProjects,
          openBugs: m.openBugs,
          pendingApprovals: h.pendingApprovals ?? m.pendingApprovals,
          activeAgents: m.activeAgents,
        });
      })
      .catch(() => {
        setMetrics({
          activeProjects: m.activeProjects,
          openBugs: m.openBugs,
          pendingApprovals: m.pendingApprovals,
          activeAgents: m.activeAgents,
        });
      });

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

    const loadActivity = () => {
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
    };

    loadActivity();
    const interval = setInterval(loadActivity, 5000);

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
    const jobsInterval = setInterval(loadJobs, 4000);

    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
      clearInterval(jobsInterval);
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
        <CeoCommand />

        {/* Metrics row */}
        <div className="mo-metrics" style={{ flexShrink: 0 }}>
          <MetricCard label="Active Projects"   value={metrics.activeProjects}   accentColor="var(--accent-cyan)"  sub="of 10 total" />
          <MetricCard label="Open Bugs"         value={metrics.openBugs}         accentColor="var(--accent-amber)" sub="across portfolio" />
          <MetricCard label="Pending Approvals" value={metrics.pendingApprovals} accentColor={metrics.pendingApprovals > 0 ? "var(--accent-red)" : "var(--accent-green)"} sub={metrics.pendingApprovals > 0 ? "action required" : "queue clear"} />
          <MetricCard label="Active Agents"     value={metrics.activeAgents}     accentColor="var(--accent-green)" sub={`${AGENTS.length - metrics.activeAgents} standby/idle`} />
        </div>

        {/* Quick actions */}
        <div className="mo-quick-actions" style={{ flexShrink: 0 }}>
          {[
            { label: "Generate briefing", href: "/briefing" },
            { label: "Add task", href: "/tasks" },
            { label: "Search knowledge", href: "/knowledge" },
            { label: "Review approvals", href: "/approvals" },
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

        {/* System status */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "10px",
            flexShrink: 0,
            padding: "12px 14px",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
          }}
        >
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
              <span className="status-pulse" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent-green)" }} />
              <span className="mo-section-label" style={{ color: "var(--text-secondary)" }}>Activity</span>
            </div>

            {/* Log entries */}
            <div
              ref={logContainerRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "8px 0",
              }}
            >
              {logs.length === 0 ? (
                <div style={{ padding: "24px 16px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                  No activity yet. Run an agent or approve a task to see live events.
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
