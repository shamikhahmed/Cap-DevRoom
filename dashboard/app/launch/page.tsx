"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { useToast } from "../components/Toast";
import SchedulesPanel from "../components/SchedulesPanel";

interface ScoreRow {
  projectId: string;
  name: string;
  status: string;
  readiness: number;
  fails: number;
  openBugs: number;
  openIssues: number;
  momentum: number;
  priorityScore: number;
  signal: "Ship" | "Invest" | "Fix" | "Hold" | "Cut";
  rationale: string;
}

interface CheckItem {
  checkId: string;
  category: string;
  label: string;
  status: "pass" | "warn" | "fail" | "pending" | "na";
  detail?: string;
  auto: boolean;
  weight: number;
  approvedBy?: string;
}
interface ReadinessReport {
  projectId: string;
  score: number;
  ready: boolean;
  counts: { pass: number; warn: number; fail: number; pending: number; total: number };
  categories: { name: string; score: number; items: CheckItem[] }[];
}

const MARK: Record<CheckItem["status"], string> = { pass: "✓", warn: "!", fail: "✕", pending: "○", na: "–" };

function Ring({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="mo-ring" style={{ ["--pct" as string]: pct, ["--ring-color" as string]: color }}>
      <div className="mo-ring-inner">{pct}</div>
    </div>
  );
}

function ringColor(score: number): string {
  if (score >= 85) return "var(--accent-green)";
  if (score >= 60) return "var(--accent-blue)";
  if (score >= 40) return "var(--accent-amber)";
  return "var(--accent-red)";
}

export default function LaunchPage() {
  const { toast } = useToast();
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reports, setReports] = useState<Record<string, ReadinessReport>>({});
  const [exec, setExec] = useState<{ narrative: string; ai: boolean } | null>(null);

  const loadScores = useCallback(() => {
    setLoading(true);
    fetch("/api/priority")
      .then((r) => r.json())
      .then((d) => setScores(d.scores ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadScores, [loadScores]);

  async function scanAll() {
    setBusy(true);
    toast({ title: "Scanning portfolio", detail: "Self-checking every app…" });
    try {
      await fetch("/api/readiness", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "scanAll" }) });
      toast({ kind: "success", title: "Scan complete" });
      loadScores();
      setReports({});
    } catch {
      toast({ kind: "error", title: "Scan failed" });
    } finally {
      setBusy(false);
    }
  }

  async function runDue() {
    setBusy(true);
    toast({ title: "Running due crews" });
    try {
      const r = await fetch("/api/scheduled?action=run-due");
      const d = await r.json();
      toast({ kind: "success", title: "Crews dispatched", detail: `${d.ran?.length ?? 0} run, ${d.skipped ?? 0} skipped` });
    } catch {
      toast({ kind: "error", title: "Run failed" });
    } finally {
      setBusy(false);
    }
  }

  async function genReport() {
    setBusy(true);
    toast({ title: "Generating executive report" });
    try {
      const r = await fetch("/api/exec-report", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setExec({ narrative: d.narrative, ai: d.ai });
      toast({ kind: "success", title: "Report ready" });
    } catch (e) {
      toast({ kind: "error", title: "Report failed", detail: e instanceof Error ? e.message : "" });
    } finally {
      setBusy(false);
    }
  }

  async function toggleExpand(projectId: string) {
    if (expanded === projectId) { setExpanded(null); return; }
    setExpanded(projectId);
    if (!reports[projectId]) {
      const r = await fetch(`/api/readiness?projectId=${encodeURIComponent(projectId)}`);
      const d = await r.json();
      setReports((m) => ({ ...m, [projectId]: d.report }));
    }
  }

  async function scanOne(projectId: string) {
    const r = await fetch("/api/readiness", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "scan", projectId }) });
    const d = await r.json();
    setReports((m) => ({ ...m, [projectId]: d.report }));
    toast({ kind: "success", title: `${projectId} re-checked` });
    loadScores();
  }

  async function approve(projectId: string, checkId: string, approve: boolean) {
    const r = await fetch("/api/readiness", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: approve ? "approve" : "unapprove", projectId, checkId }) });
    const d = await r.json();
    setReports((m) => ({ ...m, [projectId]: d.report }));
    loadScores();
  }

  const shipReady = scores.filter((s) => s.signal === "Ship");
  const avgReadiness = scores.length ? Math.round(scores.reduce((a, s) => a + s.readiness, 0) / scores.length) : 0;

  return (
    <AppShell>
      <div className="mo-page" style={{ maxWidth: 1080 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <div>
            <div className="mo-eyebrow">CTO Office · Launch Control</div>
            <h1 className="mo-title">Portfolio Launch Readiness</h1>
            <p className="t-subhead" style={{ marginTop: 6, maxWidth: 560 }}>
              Self-checked across {scores.length} apps · {avgReadiness}% avg ready · {shipReady.length} ship-ready
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="mo-btn" disabled={busy} onClick={runDue}>Run crews</button>
            <button className="mo-btn" disabled={busy} onClick={genReport}>Exec report</button>
            <button className="mo-btn mo-btn-primary" disabled={busy} onClick={scanAll}>{busy ? "Working…" : "Scan all"}</button>
          </div>
        </div>

        {exec && (
          <div className="mo-card" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="t-headline">Executive Report</div>
              <span className="t-caption">{exec.ai ? "AI · APEX" : "Deterministic"}</span>
            </div>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-ui)", fontSize: "var(--t-subhead)", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{exec.narrative}</pre>
          </div>
        )}

        {loading ? (
          <div className="t-subhead" style={{ padding: 40, textAlign: "center" }}>Loading portfolio…</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {scores.map((s) => {
              const rep = reports[s.projectId];
              const open = expanded === s.projectId;
              return (
                <div key={s.projectId} className="mo-card" style={{ overflow: "hidden" }}>
                  <button
                    onClick={() => toggleExpand(s.projectId)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: 16, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <Ring pct={s.priorityScore} color={ringColor(s.readiness)} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="t-headline" style={{ color: "var(--text-primary)" }}>{s.name}</span>
                        <span className={`mo-signal mo-signal-${s.signal}`}>{s.signal}</span>
                      </div>
                      <div className="t-footnote" style={{ marginTop: 3 }}>{s.rationale}</div>
                    </div>
                    <div style={{ display: "flex", gap: 18, textAlign: "right" }}>
                      <Stat label="Ready" value={`${s.readiness}%`} />
                      <Stat label="Blockers" value={String(s.fails)} warn={s.fails > 0} />
                      <Stat label="Issues" value={String(s.openIssues)} />
                      <Stat label="Momentum" value={String(s.momentum)} />
                    </div>
                    <span style={{ color: "var(--text-muted)", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
                  </button>

                  {open && (
                    <div style={{ borderTop: "0.5px solid var(--border)", padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <div className="t-subhead" style={{ color: "var(--text-secondary)" }}>
                          {rep ? `${rep.counts.pass} pass · ${rep.counts.warn} warn · ${rep.counts.fail} fail · ${rep.counts.pending} pending` : "Loading…"}
                        </div>
                        <button className="mo-btn" style={{ padding: "5px 12px" }} onClick={() => scanOne(s.projectId)}>Re-check</button>
                      </div>

                      {rep && (
                        <>
                          <div className="mo-cat-grid" style={{ marginBottom: 14 }}>
                            {rep.categories.map((c) => (
                              <div key={c.name} className="mo-cat-pill">
                                <div className="mo-cat-name">{c.name}</div>
                                <div className="mo-cat-score" style={{ color: ringColor(c.score) }}>{c.score}%</div>
                              </div>
                            ))}
                          </div>
                          <div>
                            {rep.categories.flatMap((c) => c.items).map((it) => (
                              <div key={it.checkId} className="mo-check-row">
                                <span className={`mo-check-mark mo-check-${it.status}`}>{MARK[it.status]}</span>
                                <div style={{ flex: 1 }}>
                                  <div className="mo-check-label">{it.label}</div>
                                  {it.detail && <div className="mo-check-detail">{it.detail}</div>}
                                </div>
                                {!it.auto && (
                                  it.status === "pass"
                                    ? <button className="mo-check-approve" onClick={() => approve(s.projectId, it.checkId, false)}>Approved ✓</button>
                                    : <button className="mo-check-approve" onClick={() => approve(s.projectId, it.checkId, true)}>Approve</button>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <SchedulesPanel />
      </div>
    </AppShell>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <div className="t-num t-headline" style={{ color: warn ? "var(--accent-red)" : "var(--text-primary)" }}>{value}</div>
      <div className="t-caption">{label}</div>
    </div>
  );
}
