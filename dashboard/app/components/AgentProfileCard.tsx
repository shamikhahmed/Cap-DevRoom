"use client";

import Link from "next/link";

export interface RosterAgent {
  codename: string;
  name: string;
  jobTitle: string;
  jobDescription: string;
  department: string;
  reportsTo: string;
  reportsToLabel: string;
  skills: string[];
  defaultRisk: string;
  salary: { tokens: number; cost: number; runs: number };
  lastRunAt: string | null;
  liveStatus: "active" | "idle" | "standby";
  recentJobs: Array<{
    id: string;
    task: string;
    status: string;
    projectId: string;
    tokensUsed: number;
    createdAt: string;
  }>;
  workMemory: Array<{ date: string; title: string; excerpt: string }>;
}

const LIVE_COLORS = {
  active: "var(--accent-green)",
  idle: "var(--accent-amber)",
  standby: "var(--text-muted)",
};

const ACCENT: Record<string, string> = {
  APEX: "var(--accent-cyan)",
  FORGE: "var(--accent-amber)",
  PRISM: "var(--accent-violet)",
  PIXEL: "var(--accent-cyan)",
  CORE: "var(--accent-green)",
  SHIELD: "var(--accent-amber)",
  VAULT: "var(--accent-red)",
  LENS: "var(--accent-cyan)",
  SCROLL: "var(--text-secondary)",
  QUILL: "var(--accent-violet)",
  SLIDE: "var(--accent-cyan)",
  PITCH: "var(--accent-amber)",
  INK: "var(--accent-violet)",
};

export function AgentProfileCard({
  agent,
  onActivate,
  compact = false,
}: {
  agent: RosterAgent;
  onActivate?: (a: RosterAgent) => void;
  compact?: boolean;
}) {
  const accent = ACCENT[agent.codename] ?? "var(--accent-cyan)";
  const liveColor = LIVE_COLORS[agent.liveStatus];

  return (
    <div
      className="mo-card card-hover"
      style={{
        padding: compact ? 14 : 18,
        height: compact ? "auto" : "100%",
        display: "flex",
        flexDirection: "column",
        borderTop: `2px solid ${liveColor}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `color-mix(in srgb, ${accent} 14%, transparent)`,
            border: `1px solid color-mix(in srgb, ${accent} 35%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 11,
            color: accent,
            letterSpacing: 1,
          }}
        >
          {agent.codename.slice(0, 2)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="font-heading" style={{ fontSize: 16, fontWeight: 600 }}>
              {agent.name}
            </span>
            <span
              style={{
                fontSize: 9,
                padding: "2px 8px",
                borderRadius: 99,
                background: `color-mix(in srgb, ${liveColor} 12%, transparent)`,
                color: liveColor,
                border: `1px solid color-mix(in srgb, ${liveColor} 30%, transparent)`,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {agent.liveStatus}
            </span>
          </div>
          <div style={{ fontSize: 11, color: accent, marginTop: 2 }}>{agent.jobTitle}</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{agent.department}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        <span className="mo-tag">Reports to {agent.reportsToLabel}</span>
        <span
          className="mo-tag"
          style={{
            color: "var(--accent)",
            borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
            background: "var(--accent-soft)",
          }}
        >
          {agent.salary.tokens.toLocaleString()} tokens · ${agent.salary.cost.toFixed(4)} · {agent.salary.runs} runs
        </span>
      </div>

      {!compact && (
        <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55, margin: "0 0 12px", flex: 1 }}>
          {agent.jobDescription}
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
        {agent.skills.slice(0, compact ? 3 : 5).map((s) => (
          <span key={s} className="mo-tag" style={{ fontSize: 9 }}>
            {s}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        {onActivate && (
          <button type="button" className="mo-btn mo-btn-primary" style={{ flex: 1, fontSize: 11 }} onClick={() => onActivate(agent)}>
            Activate
          </button>
        )}
        <Link
          href={`/agents/${agent.codename.toLowerCase()}`}
          className="mo-btn"
          style={{ flex: 1, fontSize: 11, textDecoration: "none", textAlign: "center" }}
        >
          Workspace
        </Link>
      </div>
    </div>
  );
}

export function OrgChart({ roster }: { roster: RosterAgent[] }) {
  const byCode = Object.fromEntries(roster.map((a) => [a.codename, a]));
  const apex = byCode.APEX;
  const forge = byCode.FORGE;
  const prism = byCode.PRISM;
  const forgeReports = roster.filter((a) => a.reportsTo === "FORGE");
  const apexDirect = roster.filter((a) => a.reportsTo === "APEX" && a.codename !== "FORGE" && a.codename !== "PRISM");
  const prismReports = roster.filter((a) => a.reportsTo === "PRISM");

  return (
    <div className="mo-card" style={{ padding: 20, marginBottom: 20 }}>
      <div className="mo-section-label" style={{ marginBottom: 14 }}>
        Org chart
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontSize: 12 }}>
        <div className="mo-tag" style={{ padding: "8px 16px" }}>
          You (Founder)
        </div>
        <div style={{ width: 1, height: 16, background: "var(--border)" }} />
        {apex && (
          <div className="mo-tag" style={{ padding: "8px 16px", color: "var(--accent-cyan)", borderColor: "rgba(110,181,217,0.35)" }}>
            {apex.name} · {apex.jobTitle}
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 10,
            width: "100%",
            marginTop: 8,
          }}
        >
          {[forge, prism, ...apexDirect].filter(Boolean).map((a) => (
            <div key={a!.codename} className="mo-tag" style={{ textAlign: "center", padding: "8px 10px" }}>
              {a!.codename} · {a!.name}
            </div>
          ))}
        </div>
        {forge && forgeReports.length > 0 && (
          <>
            <div className="mo-section-label" style={{ marginTop: 8 }}>
              Reports to {forge.name}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {forgeReports.map((a) => (
                <span key={a.codename} className="mo-tag">
                  {a.codename}
                </span>
              ))}
            </div>
          </>
        )}
        {prism && prismReports.length > 0 && (
          <>
            <div className="mo-section-label" style={{ marginTop: 8 }}>
              Reports to {prism.name}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {prismReports.map((a) => (
                <span key={a.codename} className="mo-tag">
                  {a.codename}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
