"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { apiFetch } from "../lib/api-fetch";
import { useJobLog } from "../components/JobLogContext";
import { AGENTS, getProjects, getApprovals, getPriorities, type Agent } from "../lib/data";
import { AGENT_PROMPT_TEMPLATES } from "../lib/prompts";
import { PORTFOLIO_APP_IDS } from "../lib/portfolio";
import {
  AgentProfileCard,
  OrgChart,
  type RosterAgent,
} from "../components/AgentProfileCard";

/* ── Current tasks per agent ───────────────────────────────── */

const AGENT_TASKS: Record<string, string> = {
  APEX:   "Portfolio ops: 8 Cap apps investor-ready — route design pass to PIXEL",
  FORGE:  "Verify ScentCap + AuraCap SPA deep links on GitHub Pages",
  PRISM:  "Backlog: hub mobile polish + per-app frontend-design waves",
  PIXEL:  "frontend-design skill: distinct visual pass per Cap app + hub",
  CORE:   "Cap DevRoom: wire CEO command → sandbox agent runs",
  SHIELD: "Playwright: PulseCap onboarding + ScentCap demo mode",
  VAULT:  "VaultCap PIN lockout storage review — severity HIGH",
  LENS:   "Compare Cap-Markroom vs Cap DevRoom for unified agent org",
  SCROLL: "Update portfolio context in docs/portfolio-context/ for all 8 Caps",
  INK:    "Hub copy: eight apps, Device Sovereignty narrative",
  QUILL:  "README polish across Cap repos",
  SLIDE:  "Presentation decks: verify all 8 apps have presentation.html",
  PITCH:  "Investor one-pager: Capricorn Systems eight-app portfolio",
};

/* ── Accent colors ─────────────────────────────────────────── */

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

/* ── Status config ─────────────────────────────────────────── */

const STATUS_CONFIG: Record<Agent["status"], { color: string; bg: string; label: string }> = {
  active:  { color: "var(--accent-green)",  bg: "rgba(0,255,136,0.08)",   label: "ACTIVE"  },
  idle:    { color: "var(--accent-amber)",  bg: "rgba(255,170,0,0.08)",   label: "IDLE"    },
  standby: { color: "var(--text-muted)",    bg: "rgba(28,58,85,0.15)",    label: "STANDBY" },
};

/* ── Activate panel ────────────────────────────────────────── */

function ActivatePanel({
  agent,
  onClose,
}: {
  agent: Agent;
  onClose: () => void;
}) {
  const accent = AGENT_ACCENT[agent.codename] ?? "var(--accent-cyan)";
  const [task, setTask] = useState("");
  const [ctx, setCtx] = useState({
    projects: false,
    bugs: false,
    approvals: false,
    priorities: false,
  });
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [projectId, setProjectId] = useState("VaultCap");
  const [running, setRunning] = useState(false);
  const [runOutput, setRunOutput] = useState("");

  function generatePrompt() {
    const tpl = AGENT_PROMPT_TEMPLATES[agent.codename];
    const lines: string[] = [];
    lines.push("---");
    lines.push(`AGENT: ${agent.codename} — ${agent.role}`);
    lines.push(`SYSTEM: ${tpl?.systemPrompt ?? agent.description}`);
    lines.push("");
    lines.push(`TRIGGERS: ${agent.triggers.join(" | ")}`);
    lines.push("");
    lines.push(`TASK: ${task || "(no task specified)"}`);

    const hasContext =
      ctx.projects || ctx.bugs || ctx.approvals || ctx.priorities;

    if (hasContext) {
      lines.push("");
      lines.push("CONTEXT:");
      if (ctx.projects || ctx.bugs) {
        const projects = getProjects().filter((p) => p.status === "active");
        if (ctx.projects) {
          lines.push(
            "Active projects: " +
              projects.map((p) => p.name).join(", ")
          );
        }
        if (ctx.bugs) {
          const bugLines = projects
            .filter((p) => p.openBugs > 0)
            .map((p) => `  ${p.name}: ${p.openBugs} open bug(s)`);
          if (bugLines.length > 0) {
            lines.push("Open bugs:");
            lines.push(...bugLines);
          } else {
            lines.push("Open bugs: None");
          }
        }
      }
      if (ctx.approvals) {
        const approvals = getApprovals().filter((a) => a.status === "pending");
        if (approvals.length > 0) {
          lines.push(
            "Pending approvals: " +
              approvals.map((a) => `[${a.risk}] ${a.title}`).join(" | ")
          );
        } else {
          lines.push("Pending approvals: None");
        }
      }
      if (ctx.priorities) {
        const prios = getPriorities().filter((p) => !p.done);
        if (prios.length > 0) {
          lines.push(
            "Current priorities: " +
              prios.map((p, i) => `${i + 1}. ${p.text}`).join(" | ")
          );
        } else {
          lines.push("Current priorities: All complete");
        }
      }
    }

    lines.push("");
    lines.push(`OUTPUT FORMAT: ${tpl?.outputFormat ?? "Structured response tailored to task"}`);
    lines.push("---");
    setGeneratedPrompt(lines.join("\n"));
  }

  const { openDrawer } = useJobLog();

  async function runViaCursor() {
    if (!task.trim()) return;
    setRunning(true);
    setRunOutput("");
    try {
      const res = await apiFetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codename: agent.codename,
          task: task || generatedPrompt,
          projectId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRunOutput(data.error || `Request failed (${res.status})`);
        return;
      }
      if (data.needsApproval) {
        setRunOutput(`Queued for approval: ${data.approvalId}\n${data.output}`);
      } else if (data.ok) {
        setRunOutput(data.output || "Complete");
        if (data.jobId) openDrawer(data.jobId);
      } else {
        setRunOutput(data.error || "Agent run failed");
      }
    } catch (e) {
      setRunOutput(e instanceof Error ? e.message : "Failed");
    } finally {
      setRunning(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        justifyContent: "flex-end",
        backgroundColor: "rgba(2,4,8,0.6)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="mo-activate-panel"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderLeft: `1px solid ${accent}40`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Panel header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <div style={{ height: "100%", width: "2px", backgroundColor: accent, alignSelf: "stretch", borderRadius: "1px" }} />
          <div style={{ flex: 1 }}>
            <div
              className="font-heading"
              style={{ fontSize: "18px", fontWeight: 700, color: accent, letterSpacing: "2px" }}
            >
              {agent.codename}
            </div>
            <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.5px" }}>
              {agent.role}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: "16px",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Panel body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {/* Task input */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "9px",
                letterSpacing: "1.5px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              Describe your task
            </label>
            <textarea
              rows={4}
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="What do you need this agent to do?"
              style={{
                width: "100%",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-bright)",
                borderRadius: "3px",
                color: "var(--text-primary)",
                fontFamily: "var(--font-data)",
                fontSize: "11px",
                padding: "10px 12px",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          {/* Context checkboxes */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "9px",
                letterSpacing: "1.5px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Include context
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {(
                [
                  { key: "projects",  label: "Project list" },
                  { key: "bugs",      label: "Open bugs" },
                  { key: "approvals", label: "Pending approvals" },
                  { key: "priorities",label: "Priorities" },
                ] as const
              ).map((c) => (
                <label
                  key={c.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "10px",
                    color: ctx[c.key] ? "var(--accent-cyan)" : "var(--text-secondary)",
                    cursor: "pointer",
                    padding: "5px 10px",
                    borderRadius: "3px",
                    border: `1px solid ${ctx[c.key] ? "rgba(0,212,255,0.35)" : "var(--border)"}`,
                    backgroundColor: ctx[c.key] ? "rgba(0,212,255,0.06)" : "var(--bg-card)",
                    transition: "all 0.15s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={ctx[c.key]}
                    onChange={(e) => setCtx((prev) => ({ ...prev, [c.key]: e.target.checked }))}
                    style={{ accentColor: "var(--accent-cyan)" }}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generatePrompt}
            className="btn-scan"
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: accent + "15",
              color: accent,
              border: `1px solid ${accent}40`,
              borderRadius: "3px",
              fontSize: "10px",
              fontWeight: "bold",
              letterSpacing: "1.5px",
              cursor: "pointer",
              fontFamily: "var(--font-data)",
              marginBottom: "16px",
            }}
          >
            GENERATE PROMPT
          </button>

          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "9px", color: "var(--text-muted)", marginBottom: "4px", letterSpacing: "1px" }}>
              SANDBOX PROJECT
            </div>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                padding: "8px",
                borderRadius: "3px",
                fontSize: "11px",
              }}
            >
              {PORTFOLIO_APP_IDS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Output */}
          {generatedPrompt && (
            <div>
              <div
                style={{
                  fontSize: "9px",
                  letterSpacing: "1.5px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                Generated prompt
              </div>
              <pre
                style={{
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "3px",
                  padding: "12px",
                  fontSize: "9px",
                  color: "var(--accent-cyan)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "var(--font-data)",
                  margin: "0 0 10px",
                  maxHeight: "280px",
                  overflowY: "auto",
                }}
              >
                {generatedPrompt}
              </pre>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={copyToClipboard}
                  className="btn-scan"
                  style={{
                    flex: 1,
                    padding: "8px",
                    backgroundColor: copied ? "rgba(0,255,136,0.1)" : "var(--bg-card)",
                    color: copied ? "var(--accent-green)" : "var(--text-secondary)",
                    border: `1px solid ${copied ? "rgba(0,255,136,0.3)" : "var(--border)"}`,
                    borderRadius: "3px",
                    fontSize: "9px",
                    letterSpacing: "1px",
                    cursor: "pointer",
                    fontFamily: "var(--font-data)",
                  }}
                >
                  {copied ? "✓ COPIED" : "COPY PROMPT"}
                </button>
                <button
                  onClick={() => runViaCursor()}
                  disabled={running}
                  className="btn-scan"
                  style={{
                    flex: 1,
                    padding: "8px",
                    backgroundColor: "rgba(0,212,255,0.1)",
                    color: "var(--accent-cyan)",
                    border: "1px solid rgba(0,212,255,0.35)",
                    borderRadius: "3px",
                    fontSize: "9px",
                    letterSpacing: "1px",
                    cursor: running ? "wait" : "pointer",
                    fontFamily: "var(--font-data)",
                    opacity: running ? 0.6 : 1,
                  }}
                >
                  {running ? "RUNNING…" : "RUN IN SANDBOX"}
                </button>
              </div>
              {runOutput && (
                <pre
                  style={{
                    marginTop: "10px",
                    fontSize: "9px",
                    color: "var(--text-secondary)",
                    whiteSpace: "pre-wrap",
                    maxHeight: "200px",
                    overflow: "auto",
                    background: "var(--bg-primary)",
                    padding: "10px",
                    borderRadius: "3px",
                    border: "1px solid var(--border)",
                  }}
                >
                  {runOutput}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Agent card ────────────────────────────────────────────── */

function AgentCard({
  agent,
  onActivate,
}: {
  agent: Agent;
  onActivate: (a: Agent) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_CONFIG[agent.status];
  const accent = AGENT_ACCENT[agent.codename] ?? "var(--accent-cyan)";
  const isActive = agent.status === "active";

  return (
    <div
      className={`card-hover agent-border-${agent.status}`}
      style={{
        backgroundColor: "var(--bg-card)",
        border: `1px solid ${isActive ? "rgba(0,212,255,0.2)" : "var(--border)"}`,
        borderRadius: "4px",
        overflow: "hidden",
        animation: isActive ? "ring-pulse 2.5s ease-out infinite" : undefined,
      }}
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          padding: "16px 18px 14px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Codename + status */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span
                className="font-heading"
                style={{ fontSize: "18px", fontWeight: 700, color: accent, letterSpacing: "2px", lineHeight: 1 }}
              >
                {agent.codename}
              </span>
              <span
                style={{
                  fontSize: "8px",
                  padding: "2px 6px",
                  borderRadius: "2px",
                  backgroundColor: sc.bg,
                  color: sc.color,
                  border: `1px solid ${sc.color}35`,
                  letterSpacing: "1px",
                }}
              >
                {sc.label}
              </span>
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginBottom: "3px" }}>
              {agent.name}
            </div>
            <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>
              {agent.role}
            </div>
          </div>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", flexShrink: 0 }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>

        {/* Current task */}
        <div
          style={{
            marginTop: "12px",
            padding: "8px 10px",
            borderRadius: "3px",
            backgroundColor: "rgba(0,0,0,0.25)",
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ fontSize: "8px", color: "var(--text-muted)", letterSpacing: "1.5px", marginBottom: "3px", textTransform: "uppercase" }}>
            Current Task
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {AGENT_TASKS[agent.codename] ?? "No active task assigned"}
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div style={{ padding: "0 18px 16px", borderTop: "1px solid var(--border)" }}>
          <p
            style={{
              fontSize: "11px",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              margin: "14px 0 14px",
            }}
          >
            {agent.description}
          </p>

          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "8px", letterSpacing: "1.5px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
              Reports To
            </div>
            <span
              style={{
                fontSize: "10px",
                padding: "3px 8px",
                borderRadius: "2px",
                backgroundColor: "rgba(0,212,255,0.08)",
                color: "var(--accent-cyan)",
                border: "1px solid rgba(0,212,255,0.18)",
              }}
            >
              {agent.reportsTo}
            </span>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "8px", letterSpacing: "1.5px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
              Activation Triggers
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {agent.triggers.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: "9px",
                    padding: "3px 8px",
                    borderRadius: "2px",
                    backgroundColor: "var(--bg-secondary)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Activate button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onActivate(agent);
            }}
            className="btn-scan"
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: accent + "12",
              color: accent,
              border: `1px solid ${accent}40`,
              borderRadius: "3px",
              fontSize: "9px",
              fontWeight: "bold",
              letterSpacing: "2px",
              cursor: "pointer",
              fontFamily: "var(--font-data)",
              marginBottom: 6,
            }}
          >
            ▶ ACTIVATE {agent.codename}
          </button>
          <Link
            href={`/agents/${agent.codename.toLowerCase()}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "block",
              width: "100%",
              padding: "7px",
              textAlign: "center",
              backgroundColor: "var(--bg-secondary)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "3px",
              fontSize: "8px",
              letterSpacing: "1.5px",
              textDecoration: "none",
              fontFamily: "var(--font-data)",
            }}
          >
            OPEN WORKSPACE
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default function AgentsPage() {
  const [filter, setFilter] = useState<Agent["status"] | "all">("all");
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [roster, setRoster] = useState<RosterAgent[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents/roster")
      .then((r) => r.json())
      .then((d: { roster?: RosterAgent[] }) => setRoster(d.roster ?? []))
      .catch(() => setRoster([]))
      .finally(() => setRosterLoading(false));
  }, []);

  const filtered = filter === "all" ? AGENTS : AGENTS.filter((a) => a.status === filter);

  const counts = {
    all: AGENTS.length,
    active: AGENTS.filter((a) => a.status === "active").length,
    idle: AGENTS.filter((a) => a.status === "idle").length,
    standby: AGENTS.filter((a) => a.status === "standby").length,
  };

  const totalTokens = roster.reduce((n, a) => n + a.salary.tokens, 0);

  function rosterAgentToAgent(r: RosterAgent): Agent | undefined {
    return AGENTS.find((a) => a.codename === r.codename);
  }

  return (
    <AppShell>
      {activeAgent && (
        <ActivatePanel agent={activeAgent} onClose={() => setActiveAgent(null)} />
      )}
      <div style={{ padding: "28px", maxWidth: 1100 }}>
        <div style={{ marginBottom: "24px" }}>
          <div className="mo-eyebrow">DevRoom · Agents</div>
          <h1 className="mo-title" style={{ marginBottom: 8 }}>
            Your engineering office
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, maxWidth: 560 }}>
            {AGENTS.length} codename agents with org chart, token salaries, and sandbox workspaces.
            {!rosterLoading && totalTokens > 0 && (
              <> Office spend: <strong style={{ color: "var(--accent)" }}>{totalTokens.toLocaleString()} tokens</strong>.</>
            )}
          </p>
        </div>

        {!rosterLoading && roster.length > 0 && <OrgChart roster={roster} />}

        {!rosterLoading && roster.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
              marginBottom: 28,
            }}
          >
            {roster.map((r) => (
              <AgentProfileCard
                key={r.codename}
                agent={r}
                onActivate={(agent) => {
                  const a = rosterAgentToAgent(agent);
                  if (a) setActiveAgent(a);
                }}
              />
            ))}
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <div className="mo-section-label" style={{ marginBottom: 8 }}>
            Legacy roster view
          </div>
          <div style={{ display: "flex", gap: "16px", marginBottom: 12 }}>
            {[
              { label: "active", color: "var(--accent-green)", count: counts.active },
              { label: "idle", color: "var(--accent-amber)", count: counts.idle },
              { label: "standby", color: "var(--text-muted)", count: counts.standby },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    backgroundColor: s.color,
                  }}
                />
                <span style={{ fontSize: "10px", color: s.color }}>
                  {s.count} {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {(["all", "active", "idle", "standby"] as const).map((f) => {
            const active = filter === f;
            const color =
              f === "active"  ? "var(--accent-green)"  :
              f === "idle"    ? "var(--accent-amber)"  :
              f === "standby" ? "var(--text-muted)"    :
              "var(--accent-cyan)";
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="btn-scan"
                style={{
                  padding: "6px 14px",
                  fontSize: "9px",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  borderRadius: "3px",
                  border: `1px solid ${active ? color : "var(--border)"}`,
                  backgroundColor: active ? `${color}15` : "var(--bg-card)",
                  color: active ? color : "var(--text-secondary)",
                  cursor: "pointer",
                  fontFamily: "var(--font-data)",
                }}
              >
                {f} ({counts[f]})
              </button>
            );
          })}
        </div>

        {/* 2-column agent grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
          }}
        >
          {filtered.map((agent) => (
            <AgentCard
              key={agent.codename}
              agent={agent}
              onActivate={setActiveAgent}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
