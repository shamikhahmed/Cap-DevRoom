"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "../components/AppShell";
import {
  APEX_RECOMMENDATION,
  getPriorities,
  getProjects,
  getApprovals,
  initStorage,
  savePriorities,
  type Priority,
  type Project,
  type Approval,
} from "../lib/data";
import { persistPriorities, syncFromServer } from "../lib/server-sync";
import { BRAND, storageKey } from "../lib/brand";

/* ── Briefing generator ─────────────────────────────────────── */

function buildBriefing(
  dateStr: string,
  priorities: Priority[],
  projects: Project[],
  approvals: Approval[]
): string {
  const incomplete = priorities.filter((p) => !p.done);
  const pending = approvals.filter((a) => a.status === "pending");
  const high = pending.filter((a) => a.risk === "High");
  const med = pending.filter((a) => a.risk === "Medium");
  const low = pending.filter((a) => a.risk === "Low");
  const active = projects.filter((p) => p.status === "active");
  const totalBugs = projects.reduce((s, p) => s + p.openBugs, 0);
  const worst = active.reduce(
    (m, p) => (p.openBugs > m.openBugs ? p : m),
    { name: "None", openBugs: 0 } as Project
  );

  const rec =
    pending.length > 3
      ? "Too many decisions pending. Block time today to clear the approval queue."
      : pending.length > 0
      ? "Clear pending approvals before starting new work. Decisions unlock progress."
      : "Queue is clear. Execute on your top priority without interruption.";

  const divider = "━━━━━━━━━━━━━━━━━━━━━━━━━━━";

  const lines = [
    `${BRAND.name.toUpperCase()} — MORNING BRIEFING`,
    divider,
    `Date: ${dateStr}`,
    "Prepared by: APEX (CEO Agent)",
    divider,
    "PRIORITIES TODAY",
    ...(incomplete.length > 0
      ? incomplete.slice(0, 3).map((p, i) => `  ${i + 1}. ${p.text}`)
      : ["  All priorities complete."]),
    divider,
    "ACTIVE RISKS",
    ...(high.length > 0
      ? high.map((a) => `  ▲ ${a.title}`)
      : ["  No high-risk items pending."]),
    divider,
    "PENDING APPROVALS",
    `  ${pending.length} items requiring decision — ${high.length} HIGH · ${med.length} MEDIUM · ${low.length} LOW`,
    divider,
    "OPEN BUGS (across portfolio)",
    `  ${totalBugs} open bugs across ${active.length} active projects`,
    `  Highest severity: ${worst.openBugs > 0 ? worst.name : "No bugs — all green"}`,
    divider,
    "PROJECT STATUS",
    ...active.map((p) => `  ${p.name} · ${p.status.toUpperCase()} · ${p.openBugs} bug${p.openBugs !== 1 ? "s" : ""}`),
    divider,
    "APEX RECOMMENDATION",
    `  Focus beats breadth. ${rec}`,
    divider,
  ];

  return lines.join("\n");
}

/* ── Past briefings list ─────────────────────────────────────── */

function getPastBriefings(): Array<{ key: string; date: string }> {
  if (typeof window === "undefined") return [];
  const keys = Object.keys(localStorage)
    .filter((k) => k.startsWith(storageKey("briefing")))
    .sort()
    .reverse()
    .slice(0, 7);
  return keys.map((k) => ({ key: k, date: k.replace(storageKey("briefing"), "") }));
}

/* ── Page ────────────────────────────────────────────────────── */

export default function BriefingPage() {
  const [now, setNow] = useState(new Date());
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [stats, setStats] = useState({ active: 0, bugs: 0, approvals: 0 });
  const [generated, setGenerated] = useState("");
  const [generating, setGenerating] = useState(false);
  const [briefingSource, setBriefingSource] = useState<"rules" | "ai" | null>(null);
  const [aiError, setAiError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pastBriefings, setPastBriefings] = useState<Array<{ key: string; date: string }>>([]);
  const [viewingPast, setViewingPast] = useState<string | null>(null);

  useEffect(() => {
    initStorage();
    syncFromServer().then(() => {
      setPriorities(getPriorities());
    });
    // Pull live counts from DB via health endpoint
    fetch("/api/health")
      .then((r) => r.json())
      .then((h) => {
        setStats({
          active: h.activeProjects ?? 0,
          bugs: h.openBugs ?? 0,
          approvals: h.pendingApprovals ?? 0,
        });
      })
      .catch(() => {
        const projects = getProjects();
        const approvals = getApprovals();
        setStats({
          active: projects.filter((p) => p.status === "active").length,
          bugs: 0,
          approvals: approvals.filter((a) => a.status === "pending").length,
        });
      });
    setPastBriefings(getPastBriefings());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  function toggle(id: string) {
    const updated = priorities.map((p) =>
      p.id === id ? { ...p, done: !p.done } : p
    );
    setPriorities(updated);
    persistPriorities(updated);
  }

  function generateRules() {
    const projects = getProjects();
    const approvals = getApprovals();
    const prios = getPriorities();
    const dateStr = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const briefing = buildBriefing(dateStr, prios, projects, approvals);
    setGenerated(briefing);
    setBriefingSource("rules");
    setSaved(false);
    setCopied(false);
    setAiError("");
    setViewingPast(null);
  }

  async function generateAi() {
    setGenerating(true);
    setAiError("");
    setViewingPast(null);
    try {
      const res = await fetch("/api/briefings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "ai", projectId: "VaultCap" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI briefing failed");
      setGenerated(data.briefing);
      setBriefingSource("ai");
      setSaved(true);
      setCopied(false);
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI briefing failed — try rules-based");
      generateRules();
    } finally {
      setGenerating(false);
    }
  }

  function copyBriefing() {
    navigator.clipboard.writeText(generated).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function saveBriefing() {
    const dateKey = now.toISOString().split("T")[0];
    localStorage.setItem(`${storageKey("briefing")}${dateKey}`, generated);
    fetch("/api/briefings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "rules", content: generated }),
    }).catch(() => {});
    setSaved(true);
    setPastBriefings(getPastBriefings());
  }

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const done = priorities.filter((p) => p.done).length;
  const displayedBriefing = viewingPast
    ? localStorage.getItem(viewingPast) ?? ""
    : generated;

  return (
    <AppShell>
      <div className="mo-page" style={{ maxWidth: 820 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="mo-eyebrow">Daily briefing</div>
          <h1 className="mo-title">{dateStr}</h1>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, letterSpacing: "0.06em" }}>
            {timeStr} · Executive intelligence
          </div>
        </div>

        {/* Stats row */}
        <div className="mo-stat-row" style={{ marginBottom: "24px" }}>
          {[
            { label: "Active Projects",   value: stats.active,    color: "var(--accent-cyan)",   href: "/projects"  },
            { label: "Open Bugs",         value: stats.bugs,      color: "var(--accent-amber)",  href: "/issues"    },
            { label: "Pending Approvals", value: stats.approvals, color: stats.approvals > 0 ? "var(--accent-red)" : "var(--accent-green)", href: "/approvals" },
          ].map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="card-hover"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                overflow: "hidden",
                textDecoration: "none",
                display: "block",
              }}
            >
              <div style={{ height: "1px", backgroundColor: s.color }} />
              <div style={{ padding: "12px 16px" }}>
                <div
                  className="font-heading count-animate"
                  style={{ fontSize: "28px", fontWeight: 700, color: s.color, lineHeight: 1 }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: "4px" }}>
                  {s.label}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* APEX Recommendation block */}
        <div className="mo-card mo-accent-panel" style={{ marginBottom: 20, overflow: "hidden" }}>
          <div className="mo-accent-panel-bar" />
          <div style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span
                className="font-heading"
                style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "var(--text-muted)" }}
              >
                APEX Recommendation
              </span>
              <span
                style={{
                  fontSize: "9px",
                  padding: "2px 8px",
                  borderRadius: "2px",
                  backgroundColor: "var(--accent-soft)",
                  color: "var(--accent)",
                  border: "1px solid color-mix(in srgb, var(--accent) 28%, transparent)",
                  letterSpacing: "1px",
                }}
              >
                CEO
              </span>
              <span
                style={{
                  fontSize: "9px",
                  padding: "2px 8px",
                  borderRadius: "2px",
                  backgroundColor: "rgba(0,255,136,0.08)",
                  color: "var(--accent-green)",
                  border: "1px solid rgba(0,255,136,0.2)",
                  letterSpacing: "1px",
                  marginLeft: "auto",
                }}
              >
                DIRECTIVE ACTIVE
              </span>
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-primary)",
                lineHeight: 1.7,
                margin: 0,
                borderLeft: "2px solid var(--accent)",
                paddingLeft: "14px",
              }}
            >
              &ldquo;{APEX_RECOMMENDATION}&rdquo;
            </p>
          </div>
        </div>

        {/* Today's Priorities */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            overflow: "hidden",
            marginBottom: "24px",
          }}
        >
          <div style={{ height: "1px", backgroundColor: "var(--accent-amber)" }} />
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <span style={{ fontSize: "9px", letterSpacing: "2px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Today&apos;s Priorities
              </span>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                {done}/{priorities.length} complete
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {priorities.map((p) => (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: "6px 8px",
                    borderRadius: "3px",
                    backgroundColor: p.done ? "rgba(0,255,136,0.03)" : "transparent",
                    opacity: p.done ? 0.45 : 1,
                    transition: "opacity 0.2s",
                    width: "100%",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      color: p.done ? "var(--accent-green)" : "var(--text-muted)",
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    {p.done ? "✓" : "○"}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: p.done ? "var(--text-muted)" : "var(--text-secondary)",
                      textDecoration: p.done ? "line-through" : "none",
                      lineHeight: 1.5,
                    }}
                  >
                    {p.text}
                  </span>
                </button>
              ))}
            </div>

            {done === priorities.length && priorities.length > 0 && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "8px 12px",
                  borderRadius: "3px",
                  backgroundColor: "rgba(0,255,136,0.06)",
                  border: "1px solid rgba(0,255,136,0.15)",
                  fontSize: "10px",
                  color: "var(--accent-green)",
                  letterSpacing: "0.5px",
                }}
              >
                ✓ All priorities complete. Excellent execution.
              </div>
            )}
          </div>
        </div>

        {/* ── Briefing Generator ──────────────────────────────────────── */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-bright)",
            borderRadius: "4px",
            overflow: "hidden",
            marginBottom: "24px",
          }}
        >
          <div className="mo-accent-panel-bar" style={{ background: "linear-gradient(90deg, var(--accent), transparent)" }} />
          <div style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ fontSize: "9px", letterSpacing: "2px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Briefing Generator
              </span>
              <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                Reads from live data
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: generated || aiError ? 16 : 0 }}>
              <button
                onClick={generateRules}
                disabled={generating}
                className="btn-scan"
                style={{
                  flex: 1,
                  padding: "11px",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "3px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  letterSpacing: "1.5px",
                  cursor: generating ? "wait" : "pointer",
                  fontFamily: "var(--font-data)",
                  opacity: generating ? 0.6 : 1,
                }}
              >
                RULES BRIEFING
              </button>
              <button
                onClick={generateAi}
                disabled={generating}
                className="btn-scan"
                style={{
                  flex: 1,
                  padding: "11px",
                  backgroundColor: "rgba(0,212,255,0.08)",
                  color: "var(--accent-cyan)",
                  border: "1px solid rgba(0,212,255,0.35)",
                  borderRadius: "3px",
                  fontSize: "10px",
                  fontWeight: "bold",
                  letterSpacing: "1.5px",
                  cursor: generating ? "wait" : "pointer",
                  fontFamily: "var(--font-data)",
                  opacity: generating ? 0.6 : 1,
                }}
              >
                {generating ? "APEX THINKING…" : "⚡ AI BRIEFING (APEX)"}
              </button>
            </div>
            {aiError && (
              <p style={{ fontSize: 10, color: "var(--accent-amber)", marginBottom: 12 }}>
                {aiError} — showing rules-based fallback.
              </p>
            )}
            {briefingSource && displayedBriefing && !viewingPast && (
              <p style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 8, letterSpacing: 1 }}>
                Source: {briefingSource === "ai" ? "Cursor SDK · APEX" : "Rules engine"}
              </p>
            )}

            {/* Terminal output */}
            {displayedBriefing && (
              <>
                {viewingPast && (
                  <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "9px", color: "var(--accent-amber)", letterSpacing: "1px" }}>
                      VIEWING: {viewingPast.replace(storageKey("briefing"), "")}
                    </span>
                    <button
                      onClick={() => setViewingPast(null)}
                      style={{
                        fontSize: "8px",
                        color: "var(--text-muted)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font-data)",
                        letterSpacing: "0.5px",
                      }}
                    >
                      [back to current]
                    </button>
                  </div>
                )}
                <pre
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "3px",
                    padding: "16px",
                    fontFamily: "var(--font-data)",
                    fontSize: "10px",
                    color: "var(--accent-cyan)",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    margin: "0 0 12px",
                    maxHeight: "400px",
                    overflowY: "auto",
                  }}
                >
                  {displayedBriefing}
                </pre>

                {!viewingPast && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={copyBriefing}
                      className="btn-scan"
                      style={{
                        flex: 1,
                        padding: "8px",
                        backgroundColor: copied ? "rgba(0,255,136,0.1)" : "var(--bg-secondary)",
                        color: copied ? "var(--accent-green)" : "var(--text-secondary)",
                        border: `1px solid ${copied ? "rgba(0,255,136,0.3)" : "var(--border)"}`,
                        borderRadius: "3px",
                        fontSize: "9px",
                        letterSpacing: "1px",
                        cursor: "pointer",
                        fontFamily: "var(--font-data)",
                      }}
                    >
                      {copied ? "✓ COPIED" : "COPY TO CLIPBOARD"}
                    </button>
                    <button
                      onClick={saveBriefing}
                      className="btn-scan"
                      style={{
                        flex: 1,
                        padding: "8px",
                        backgroundColor: saved ? "rgba(0,212,255,0.1)" : "var(--bg-secondary)",
                        color: saved ? "var(--accent-cyan)" : "var(--text-secondary)",
                        border: `1px solid ${saved ? "rgba(0,212,255,0.35)" : "var(--border)"}`,
                        borderRadius: "3px",
                        fontSize: "9px",
                        letterSpacing: "1px",
                        cursor: "pointer",
                        fontFamily: "var(--font-data)",
                      }}
                    >
                      {saved ? "✓ SAVED" : "SAVE BRIEFING"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Past briefings */}
        {pastBriefings.length > 0 && (
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div style={{ height: "1px", backgroundColor: "var(--border-bright)" }} />
            <div style={{ padding: "14px 20px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "2px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "10px" }}>
                Saved Briefings
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {pastBriefings.map((b) => (
                  <button
                    key={b.key}
                    onClick={() => {
                      setViewingPast(viewingPast === b.key ? null : b.key);
                      setGenerated("");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "7px 10px",
                      borderRadius: "3px",
                      backgroundColor: viewingPast === b.key ? "rgba(0,212,255,0.06)" : "var(--bg-secondary)",
                      border: `1px solid ${viewingPast === b.key ? "rgba(0,212,255,0.2)" : "var(--border)"}`,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "var(--font-data)",
                    }}
                  >
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>≡</span>
                    <span style={{ fontSize: "10px", color: viewingPast === b.key ? "var(--accent-cyan)" : "var(--text-secondary)", flex: 1 }}>
                      Briefing — {b.date}
                    </span>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                      {viewingPast === b.key ? "hide" : "view"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
