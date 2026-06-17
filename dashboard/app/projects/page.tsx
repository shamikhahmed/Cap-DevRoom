"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import {
  getProjects,
  getApprovals,
  saveProjects,
  initStorage,
  type Project,
  type Approval,
} from "../lib/data";

/* ── Per-project issue lists ──────────────────────────────── */

type Severity = "critical" | "high" | "medium" | "low";

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "var(--accent-red)",
  high:     "var(--accent-amber)",
  medium:   "#bc8cff",
  low:      "var(--text-secondary)",
};

const SEVERITY_BG: Record<Severity, string> = {
  critical: "rgba(255,51,85,0.08)",
  high:     "rgba(255,170,0,0.08)",
  medium:   "rgba(188,140,255,0.08)",
  low:      "rgba(74,122,154,0.08)",
};

const PROJECT_ISSUES: Record<string, Array<{ text: string; severity: Severity }>> = {
  "proj-000": [
    { text: "Activity log needs real-time backend for persistent events", severity: "low" },
  ],
  "proj-001": [],
  "proj-002": [
    { text: "AI coach personality switch resets active workout session state",       severity: "high"   },
    { text: "PR detection triggers incorrectly on warm-up set weights",             severity: "medium" },
    { text: "Nutrition log loses scroll position when navigating back",             severity: "low"    },
  ],
  "proj-003": [
    { text: "RecoveryEngine.score() returns NaN on fresh install (no history)",     severity: "critical" },
    { text: "Workout timer drifts after device enters sleep/lock screen",           severity: "medium"   },
  ],
  "proj-004": [
    { text: "Tournament bracket rendering breaks at 7-player count",               severity: "medium" },
  ],
  "proj-005": [],
  "proj-006": [],
  "proj-007": [],
  "proj-008": [],
  "proj-009": [],
};

/* ── Health score ─────────────────────────────────────────── */

interface HealthScore {
  label: string;
  color: string;
  bg: string;
  flagged: boolean;
}

function getHealthScore(project: Project, pendingApprovals: Approval[]): HealthScore {
  const flagged = pendingApprovals.some(
    (a) =>
      a.risk === "High" &&
      a.status === "pending" &&
      a.description.toLowerCase().includes(project.name.toLowerCase().split(" ")[0])
  );

  if (project.status === "archived")
    return { label: "ARCHIVED", color: "var(--text-muted)", bg: "rgba(28,58,85,0.1)", flagged };
  if (project.status === "paused")
    return { label: "PAUSED", color: "var(--accent-amber)", bg: "rgba(255,170,0,0.08)", flagged };
  if (project.openBugs === 0)
    return { label: "OPTIMAL", color: "var(--accent-green)", bg: "rgba(0,255,136,0.08)", flagged };
  if (project.openBugs <= 2)
    return { label: "GOOD", color: "var(--accent-cyan)", bg: "rgba(0,212,255,0.08)", flagged };
  return { label: "DEGRADED", color: "var(--accent-amber)", bg: "rgba(255,170,0,0.08)", flagged };
}

/* ── Status config ────────────────────────────────────────── */

const STATUS_COLOR: Record<Project["status"], string> = {
  active:   "var(--accent-green)",
  paused:   "var(--accent-amber)",
  archived: "var(--text-muted)",
};

const STATUS_BG: Record<Project["status"], string> = {
  active:   "rgba(0,255,136,0.08)",
  paused:   "rgba(255,170,0,0.08)",
  archived: "rgba(72,79,88,0.12)",
};

/* ── New project modal ────────────────────────────────────── */

function NewProjectModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (p: Project) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function submit() {
    if (!name.trim()) return;
    onSave({
      id: `proj-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      status: "active",
      openBugs: 0,
      createdAt: new Date().toISOString().split("T")[0],
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        backgroundColor: "rgba(2,4,8,0.85)",
      }}
    >
      <div
        style={{
          width: "440px",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-bright)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div style={{ height: "2px", backgroundColor: "var(--accent-cyan)" }} />
        <div style={{ padding: "20px 24px 24px" }}>
          <div
            style={{
              fontSize: "9px",
              letterSpacing: "2px",
              color: "var(--text-muted)",
              textTransform: "uppercase",
              marginBottom: "18px",
            }}
          >
            Init New Project
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { label: "Project Name", value: name, set: setName, multiline: false, placeholder: "e.g. API Gateway v2" },
              { label: "Description", value: description, set: setDescription, multiline: true, placeholder: "What is this project?" },
            ].map((f) => (
              <div key={f.label}>
                <label
                  style={{ display: "block", fontSize: "10px", color: "var(--text-secondary)", marginBottom: "6px", letterSpacing: "0.5px" }}
                >
                  {f.label}
                </label>
                {f.multiline ? (
                  <textarea
                    rows={3}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    style={{
                      width: "100%",
                      backgroundColor: "var(--bg-secondary)",
                      border: "1px solid var(--border-bright)",
                      borderRadius: "3px",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-data)",
                      fontSize: "11px",
                      padding: "8px 10px",
                      outline: "none",
                      resize: "none",
                    }}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <input
                    autoFocus
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    style={{
                      width: "100%",
                      backgroundColor: "var(--bg-secondary)",
                      border: "1px solid var(--border-bright)",
                      borderRadius: "3px",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-data)",
                      fontSize: "11px",
                      padding: "8px 10px",
                      outline: "none",
                    }}
                    placeholder={f.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              onClick={submit}
              style={{
                flex: 1,
                padding: "9px",
                backgroundColor: "var(--accent-cyan)",
                color: "var(--bg-primary)",
                border: "none",
                borderRadius: "3px",
                fontSize: "10px",
                fontWeight: "bold",
                letterSpacing: "1.5px",
                cursor: "pointer",
                fontFamily: "var(--font-data)",
              }}
            >
              INIT PROJECT
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "9px 16px",
                backgroundColor: "transparent",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "3px",
                fontSize: "10px",
                cursor: "pointer",
                fontFamily: "var(--font-data)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Project panel ────────────────────────────────────────── */

function ProjectPanel({
  project,
  health,
  onCycleStatus,
}: {
  project: Project;
  health: HealthScore;
  onCycleStatus: (id: string) => void;
}) {
  const issues = PROJECT_ISSUES[project.id] ?? [];
  const statusColor = STATUS_COLOR[project.status];

  return (
    <div
      className="card-hover"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      {/* Accent top bar */}
      <div style={{ height: "2px", backgroundColor: statusColor }} />

      <div style={{ padding: "16px 18px" }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="font-heading"
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "0.5px",
              }}
            >
              {project.name}
            </div>
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "9px",
                  color: "var(--accent-green)",
                  textDecoration: "none",
                  letterSpacing: "0.5px",
                }}
              >
                ↗ LIVE
              </a>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0 }}>
            {/* Health badge */}
            <span
              style={{
                fontSize: "8px",
                padding: "2px 7px",
                borderRadius: "2px",
                backgroundColor: health.bg,
                color: health.color,
                border: `1px solid ${health.color}40`,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              {health.flagged && "⚠ "}{health.label}
            </span>
            <button
              onClick={() => onCycleStatus(project.id)}
              className="btn-scan"
              style={{
                fontSize: "8px",
                padding: "3px 8px",
                borderRadius: "2px",
                backgroundColor: STATUS_BG[project.status],
                color: statusColor,
                border: `1px solid ${statusColor}40`,
                cursor: "pointer",
                letterSpacing: "1px",
                textTransform: "uppercase",
                fontFamily: "var(--font-data)",
              }}
            >
              {project.status}
            </button>
          </div>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            margin: "0 0 10px",
          }}
        >
          {project.description || "No description."}
        </p>

        {/* Meta row */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            fontSize: "9px",
            color: "var(--text-muted)",
            marginBottom: issues.length > 0 ? "12px" : 0,
            letterSpacing: "0.3px",
          }}
        >
          {project.stack && (
            <span style={{ color: "rgba(0,212,255,0.55)" }}>{project.stack}</span>
          )}
          <span>Created: {project.createdAt}</span>
          {project.openBugs === 0 && (
            <span style={{ color: "var(--accent-green)" }}>✓ No open bugs</span>
          )}
        </div>

        {/* Issue list */}
        {issues.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {issues.map((issue, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "5px 8px",
                  borderRadius: "3px",
                  backgroundColor: SEVERITY_BG[issue.severity],
                  border: `1px solid ${SEVERITY_COLOR[issue.severity]}20`,
                }}
              >
                <span
                  style={{
                    fontSize: "8px",
                    padding: "1px 5px",
                    borderRadius: "2px",
                    backgroundColor: `${SEVERITY_COLOR[issue.severity]}15`,
                    color: SEVERITY_COLOR[issue.severity],
                    border: `1px solid ${SEVERITY_COLOR[issue.severity]}35`,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    flexShrink: 0,
                    fontFamily: "var(--font-data)",
                  }}
                >
                  {issue.severity}
                </span>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  {issue.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<"active" | "paused" | "archived" | "all">("active");
  const [sandboxStale, setSandboxStale] = useState(false);
  const [daysSinceSync, setDaysSinceSync] = useState<number | null>(null);

  useEffect(() => {
    initStorage();
    setProjects(getProjects());
    const approvals = getApprovals();
    setPendingApprovals(approvals.filter((a) => a.status === "pending"));
    fetch("/api/health")
      .then((r) => r.json())
      .then((h) => {
        if (h.sandboxSync?.stale) {
          setSandboxStale(true);
          setDaysSinceSync(h.sandboxSync.daysSinceSync ?? null);
        }
      })
      .catch(() => {});
  }, []);

  function addProject(p: Project) {
    const updated = [...projects, p];
    setProjects(updated);
    saveProjects(updated);
    setShowModal(false);
  }

  function cycleStatus(id: string) {
    const cycle: Project["status"][] = ["active", "paused", "archived"];
    const updated = projects.map((p) => {
      if (p.id !== id) return p;
      const idx = cycle.indexOf(p.status);
      return { ...p, status: cycle[(idx + 1) % cycle.length] };
    });
    setProjects(updated);
    saveProjects(updated);
  }

  const counts = {
    all:      projects.length,
    active:   projects.filter((p) => p.status === "active").length,
    paused:   projects.filter((p) => p.status === "paused").length,
    archived: projects.filter((p) => p.status === "archived").length,
  };

  const filtered =
    tab === "all" ? projects : projects.filter((p) => p.status === tab);

  return (
    <AppShell>
      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onSave={addProject}
        />
      )}
      <div style={{ padding: "28px", maxWidth: "900px" }}>
        {sandboxStale && (
          <div
            role="alert"
            className="mo-card"
            style={{
              padding: "14px 16px",
              marginBottom: 16,
              borderColor: "rgba(212,168,83,0.4)",
              background: "var(--accent-soft)",
            }}
          >
            <div style={{ fontWeight: 600, color: "var(--accent)", fontSize: 13, marginBottom: 4 }}>
              Sandboxes may be stale
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Last sync{daysSinceSync != null ? ` was ${daysSinceSync} day(s) ago` : " unknown"}.
              Run <code>npm run sync:sandboxes</code> from Cap-DevRoom before agent runs.
            </p>
          </div>
        )}
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "9px",
                letterSpacing: "2.5px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginBottom: "4px",
              }}
            >
              DEVROOM // PROJECTS
            </div>
            <div
              className="font-heading"
              style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}
            >
              {projects.length} Project{projects.length !== 1 ? "s" : ""} Tracked
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "8px 16px",
              backgroundColor: "var(--accent-cyan)",
              color: "var(--bg-primary)",
              border: "none",
              borderRadius: "3px",
              fontSize: "10px",
              fontWeight: "bold",
              letterSpacing: "1.5px",
              cursor: "pointer",
              fontFamily: "var(--font-data)",
            }}
          >
            + INIT PROJECT
          </button>
        </div>

        {/* Health summary bar */}
        {projects.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "16px",
              padding: "10px 14px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              marginBottom: "16px",
              fontSize: "10px",
              letterSpacing: "0.5px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "8px", color: "var(--text-muted)", letterSpacing: "2px", textTransform: "uppercase", alignSelf: "center" }}>
              Portfolio Health:
            </span>
            {[
              { label: "OPTIMAL",  color: "var(--accent-green)", count: projects.filter((p) => p.status === "active" && p.openBugs === 0).length },
              { label: "GOOD",     color: "var(--accent-cyan)",  count: projects.filter((p) => p.status === "active" && p.openBugs >= 1 && p.openBugs <= 2).length },
              { label: "DEGRADED", color: "var(--accent-amber)", count: projects.filter((p) => p.status === "active" && p.openBugs >= 3).length },
              { label: "PAUSED",   color: "var(--text-muted)",   count: projects.filter((p) => p.status === "paused").length },
            ].map((s) => (
              <span key={s.label} style={{ color: s.color }}>
                {s.count} {s.label}
              </span>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {(["active", "paused", "archived", "all"] as const).map((t) => {
            const active = tab === t;
            const color =
              t === "active"   ? "var(--accent-green)"  :
              t === "paused"   ? "var(--accent-amber)"  :
              t === "archived" ? "var(--text-muted)"    :
              "var(--accent-cyan)";
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
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
                {t} ({counts[t]})
              </button>
            );
          })}
        </div>

        {/* Project panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              No {tab !== "all" ? tab : ""} projects.
            </div>
          )}
          {filtered.map((project) => (
            <ProjectPanel
              key={project.id}
              project={project}
              health={getHealthScore(project, pendingApprovals)}
              onCycleStatus={cycleStatus}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
