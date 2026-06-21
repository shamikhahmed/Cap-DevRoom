"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { useToast } from "../components/Toast";

interface Finding {
  id: string;
  category: string;
  severity: string;
  title: string;
  detail: string;
  file?: string;
}

interface SecurityReport {
  projectId: string;
  scannedAt: string;
  score: number;
  grade: string;
  findings: Finding[];
  summary: string;
}

interface PortfolioSecurity {
  avgScore: number;
  criticalCount: number;
  projectsAtRisk: string[];
  reports: { projectId: string; name: string; score: number; grade: string; criticals: number }[];
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: "var(--accent-red)",
  high: "#ff8c42",
  medium: "var(--accent-amber)",
  low: "var(--text-secondary)",
  pass: "var(--accent-green)",
};

const GRADE_COLOR: Record<string, string> = {
  A: "var(--accent-green)", B: "var(--accent-cyan)", C: "var(--accent-amber)", D: "#ff8c42", F: "var(--accent-red)",
};

function GradeRing({ grade, score }: { grade: string; score: number }) {
  return (
    <div style={{ width: 56, height: 56, borderRadius: "50%", border: `3px solid ${GRADE_COLOR[grade] ?? "var(--border)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: GRADE_COLOR[grade], lineHeight: 1 }}>{grade}</div>
      <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{score}%</div>
    </div>
  );
}

export default function SecurityPage() {
  const { toast } = useToast();
  const [portfolio, setPortfolio] = useState<PortfolioSecurity | null>(null);
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPortfolio = useCallback(() => {
    fetch("/api/security")
      .then((r) => r.json())
      .then((d) => setPortfolio(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadPortfolio, [loadPortfolio]);

  async function scanAll() {
    setBusy(true);
    toast({ title: "Security scan running…", detail: "VAULT + CIPHER scanning all sandboxes" });
    try {
      const r = await fetch("/api/security", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "scanAll" }) });
      const d = await r.json();
      toast({ kind: "success", title: "Scan complete", detail: `Avg score: ${d.summary?.avgScore ?? "?"}%` });
      loadPortfolio();
      setReport(null);
      setSelected(null);
    } catch {
      toast({ kind: "error", title: "Scan failed" });
    } finally {
      setBusy(false);
    }
  }

  async function scanOne(projectId: string) {
    setBusy(true);
    try {
      const r = await fetch("/api/security", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "scan", projectId }) });
      const d = await r.json();
      setReport(d.report);
      setSelected(projectId);
      loadPortfolio();
    } catch {
      toast({ kind: "error", title: "Scan failed" });
    } finally {
      setBusy(false);
    }
  }

  async function viewReport(projectId: string) {
    if (selected === projectId && report) { setReport(null); setSelected(null); return; }
    setSelected(projectId);
    const r = await fetch(`/api/security?projectId=${encodeURIComponent(projectId)}`);
    const d = await r.json();
    setReport(d.report ?? null);
  }

  return (
    <AppShell>
      <div className="mo-page" style={{ maxWidth: 980 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div className="mo-eyebrow">Security Office · VAULT + CIPHER</div>
            <h1 className="mo-title">Security Audit</h1>
            {portfolio && (
              <p className="t-subhead" style={{ marginTop: 6 }}>
                Avg score {portfolio.avgScore}% ·{" "}
                {portfolio.criticalCount > 0
                  ? <span style={{ color: "var(--accent-red)" }}>{portfolio.criticalCount} app(s) with critical findings</span>
                  : <span style={{ color: "var(--accent-green)" }}>No critical findings</span>}
                {portfolio.projectsAtRisk.length > 0 && <> · At risk: {portfolio.projectsAtRisk.join(", ")}</>}
              </p>
            )}
          </div>
          <button className="mo-btn mo-btn-primary" disabled={busy} onClick={scanAll}>{busy ? "Scanning…" : "Scan all"}</button>
        </div>

        {loading ? (
          <div className="t-subhead" style={{ padding: 40, textAlign: "center" }}>Loading…</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(portfolio?.reports ?? []).map((r) => (
              <div key={r.projectId} className="mo-card" style={{ overflow: "hidden" }}>
                <button
                  onClick={() => viewReport(r.projectId)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: 16, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <GradeRing grade={r.grade} score={r.score} />
                  <div style={{ flex: 1 }}>
                    <div className="t-headline" style={{ color: "var(--text-primary)" }}>{r.name}</div>
                    <div className="t-footnote" style={{ marginTop: 3 }}>
                      {r.criticals > 0
                        ? <span style={{ color: "var(--accent-red)" }}>⚠ {r.criticals} critical finding(s)</span>
                        : <span style={{ color: "var(--accent-green)" }}>✓ No critical findings</span>}
                    </div>
                  </div>
                  <button className="mo-btn" style={{ padding: "5px 12px" }} onClick={(e) => { e.stopPropagation(); scanOne(r.projectId); }}>Re-scan</button>
                  <span style={{ color: "var(--text-muted)", transform: selected === r.projectId ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
                </button>

                {selected === r.projectId && report && report.projectId === r.projectId && (
                  <div style={{ borderTop: "0.5px solid var(--border)", padding: 16 }}>
                    <div className="t-subhead" style={{ marginBottom: 12, color: "var(--text-secondary)" }}>{report.summary}</div>
                    {report.findings.length === 0 ? (
                      <div style={{ padding: "16px 0", color: "var(--accent-green)" }}>✓ No security findings — clean scan.</div>
                    ) : (
                      <div>
                        {report.findings.map((f) => (
                          <div key={f.id} className="mo-check-row">
                            <span style={{ fontSize: 11, fontWeight: 700, color: SEVERITY_COLOR[f.severity], width: 56, flexShrink: 0, textTransform: "uppercase" }}>{f.severity}</span>
                            <div style={{ flex: 1 }}>
                              <div className="mo-check-label">{f.title}</div>
                              <div className="mo-check-detail">{f.detail}</div>
                            </div>
                            <span style={{ fontSize: 10, color: "var(--text-muted)", padding: "2px 6px", borderRadius: 4, backgroundColor: "var(--bg-secondary)" }}>{f.category}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="t-caption" style={{ marginTop: 10, color: "var(--text-muted)" }}>Scanned {new Date(report.scannedAt).toLocaleString()}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* What we scan */}
        <div className="mo-card" style={{ padding: 20, marginTop: 20 }}>
          <div className="t-headline" style={{ marginBottom: 12 }}>What VAULT scans</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { icon: "🔑", label: "Secrets detection", detail: "API keys, passwords, tokens, connection strings" },
              { icon: "🛡", label: "Code patterns", detail: "eval(), innerHTML, XSS vectors" },
              { icon: "📦", label: "Dependency audit", detail: "Known risky versions, lockfile presence, bloat" },
              { icon: "🔒", label: "Privacy compliance", detail: "Privacy policy, terms of service" },
            ].map((item) => (
              <div key={item.label} style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", backgroundColor: "var(--bg-secondary)", border: "0.5px solid var(--border)" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                <div className="t-subhead" style={{ color: "var(--text-primary)", marginBottom: 4 }}>{item.label}</div>
                <div className="t-caption">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
