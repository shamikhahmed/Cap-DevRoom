"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";

interface ReleaseCheckItem {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

interface ReleasePackage {
  projectId: string;
  projectName: string;
  version: string;
  generatedAt: string;
  overallScore: number;
  recommendation: "GO" | "CONDITIONAL_GO" | "NO_GO";
  completedWork: string[];
  risks: string[];
  missingItems: string[];
  checks: ReleaseCheckItem[];
  founderApprovalRequired: boolean;
  approvalReason?: string;
}

const REC_CONFIG = {
  GO:             { color: "var(--accent-green)",  bg: "rgba(0,255,136,0.08)",  label: "GO",              icon: "▲" },
  CONDITIONAL_GO: { color: "var(--accent-amber)",  bg: "rgba(255,170,0,0.08)",  label: "CONDITIONAL GO",  icon: "◆" },
  NO_GO:          { color: "var(--accent-red)",    bg: "rgba(255,59,48,0.08)",  label: "NO GO",           icon: "▼" },
};

const STATUS_ICON: Record<string, string> = { pass: "✓", warn: "⚠", fail: "✕" };
const STATUS_COLOR: Record<string, string> = {
  pass: "var(--accent-green)",
  warn: "var(--accent-amber)",
  fail: "var(--accent-red)",
};

function PackageCard({ pkg }: { pkg: ReleasePackage }) {
  const [expanded, setExpanded] = useState(false);
  const rec = REC_CONFIG[pkg.recommendation];

  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: `1px solid ${rec.color}30`,
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          padding: "16px 18px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        {/* Score ring */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: `2px solid ${rec.color}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            backgroundColor: rec.bg,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: rec.color, fontFamily: "var(--font-data)" }}>
            {pkg.overallScore}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span className="font-heading" style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              {pkg.projectName}
            </span>
            <span
              style={{
                fontSize: 8,
                padding: "2px 7px",
                borderRadius: 2,
                backgroundColor: rec.bg,
                color: rec.color,
                border: `1px solid ${rec.color}40`,
                letterSpacing: "1.5px",
                fontFamily: "var(--font-data)",
              }}
            >
              {rec.icon} {rec.label}
            </span>
            {pkg.founderApprovalRequired && (
              <span
                style={{
                  fontSize: 8,
                  padding: "2px 7px",
                  borderRadius: 2,
                  backgroundColor: "rgba(255,170,0,0.08)",
                  color: "var(--accent-amber)",
                  border: "1px solid rgba(255,170,0,0.3)",
                  letterSpacing: "1px",
                  fontFamily: "var(--font-data)",
                }}
              >
                ⚠ APPROVAL REQUIRED
              </span>
            )}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
            {pkg.version} · {new Date(pkg.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        {/* Check summary pills */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {["pass", "warn", "fail"].map((s) => {
            const count = pkg.checks.filter((c) => c.status === s).length;
            if (!count) return null;
            return (
              <span
                key={s}
                style={{
                  fontSize: 9,
                  padding: "2px 6px",
                  borderRadius: 2,
                  backgroundColor: STATUS_COLOR[s] + "15",
                  color: STATUS_COLOR[s],
                  border: `1px solid ${STATUS_COLOR[s]}35`,
                  fontFamily: "var(--font-data)",
                }}
              >
                {STATUS_ICON[s]} {count}
              </span>
            );
          })}
        </div>

        <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: "0 18px 18px", borderTop: "1px solid var(--border)" }}>
          {/* Checks */}
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <div className="mo-section-label" style={{ marginBottom: 8 }}>Release checks</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {pkg.checks.map((c) => (
                <div
                  key={c.label}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 3,
                    backgroundColor: "var(--bg-secondary)",
                    border: `1px solid ${STATUS_COLOR[c.status]}20`,
                  }}
                >
                  <span style={{ color: STATUS_COLOR[c.status], fontSize: 11, flexShrink: 0, marginTop: 1 }}>
                    {STATUS_ICON[c.status]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "var(--text-primary)", marginBottom: 2 }}>{c.label}</div>
                    <div style={{ fontSize: 9, color: "var(--text-muted)" }}>{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3-col: completed / risks / missing */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {pkg.completedWork.length > 0 && (
              <div>
                <div className="mo-section-label" style={{ marginBottom: 6, color: "var(--accent-green)" }}>
                  ✓ Completed
                </div>
                {pkg.completedWork.map((w, i) => (
                  <div key={i} style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 4, paddingLeft: 8, borderLeft: "2px solid var(--accent-green)" }}>
                    {w}
                  </div>
                ))}
              </div>
            )}
            {pkg.risks.length > 0 && (
              <div>
                <div className="mo-section-label" style={{ marginBottom: 6, color: "var(--accent-amber)" }}>
                  ⚠ Risks
                </div>
                {pkg.risks.map((r, i) => (
                  <div key={i} style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 4, paddingLeft: 8, borderLeft: "2px solid var(--accent-amber)" }}>
                    {r}
                  </div>
                ))}
              </div>
            )}
            {pkg.missingItems.length > 0 && (
              <div>
                <div className="mo-section-label" style={{ marginBottom: 6, color: "var(--accent-red)" }}>
                  ✕ Missing
                </div>
                {pkg.missingItems.map((m, i) => (
                  <div key={i} style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 4, paddingLeft: 8, borderLeft: "2px solid var(--accent-red)" }}>
                    {m}
                  </div>
                ))}
              </div>
            )}
          </div>

          {pkg.approvalReason && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 3,
                backgroundColor: "rgba(255,170,0,0.06)",
                border: "1px solid rgba(255,170,0,0.25)",
                fontSize: 11,
                color: "var(--accent-amber)",
              }}
            >
              {pkg.approvalReason}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReleasePage() {
  const [packages, setPackages] = useState<ReleasePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    try {
      const r = await fetch("/api/release");
      const d = await r.json();
      if (d.packages) setPackages(d.packages);
      else setError(d.error ?? "Failed to load packages");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const goCount = packages.filter((p) => p.recommendation === "GO").length;
  const conditionalCount = packages.filter((p) => p.recommendation === "CONDITIONAL_GO").length;
  const noGoCount = packages.filter((p) => p.recommendation === "NO_GO").length;

  return (
    <AppShell>
      <div className="mo-page" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 24 }}>
          <div className="mo-eyebrow">DevRoom · Release Management</div>
          <h1 className="mo-title" style={{ marginBottom: 8 }}>Release packages</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px", maxWidth: 560 }}>
            Structured GO / CONDITIONAL GO / NO GO decisions per active project. DELTA coordinates all releases.
          </p>

          {/* Summary pills */}
          {!loading && packages.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              {[
                { label: "GO",             count: goCount,          color: "var(--accent-green)" },
                { label: "CONDITIONAL GO", count: conditionalCount, color: "var(--accent-amber)" },
                { label: "NO GO",          count: noGoCount,        color: "var(--accent-red)"   },
              ].map((s) => s.count > 0 && (
                <span
                  key={s.label}
                  style={{
                    fontSize: 9,
                    padding: "4px 10px",
                    borderRadius: 3,
                    backgroundColor: s.color + "12",
                    color: s.color,
                    border: `1px solid ${s.color}40`,
                    letterSpacing: "1px",
                    fontFamily: "var(--font-data)",
                  }}
                >
                  {s.count} {s.label}
                </span>
              ))}
              <button
                onClick={() => load(true)}
                disabled={refreshing}
                style={{
                  fontSize: 9,
                  padding: "4px 10px",
                  borderRadius: 3,
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                  cursor: refreshing ? "wait" : "pointer",
                  fontFamily: "var(--font-data)",
                  letterSpacing: "1px",
                }}
              >
                {refreshing ? "REFRESHING…" : "↻ REFRESH"}
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "40px 0", textAlign: "center" }}>
            Generating release packages…
          </div>
        )}

        {error && (
          <div style={{ color: "var(--accent-red)", fontSize: 12, padding: "12px 16px", backgroundColor: "rgba(255,59,48,0.06)", borderRadius: 3, border: "1px solid rgba(255,59,48,0.2)", marginBottom: 16 }}>
            {error}
          </div>
        )}

        {!loading && packages.length === 0 && !error && (
          <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "40px 0", textAlign: "center" }}>
            No active projects found. Add projects in the Projects page first.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {packages
            .sort((a, b) => {
              const order = { NO_GO: 0, CONDITIONAL_GO: 1, GO: 2 };
              return order[a.recommendation] - order[b.recommendation];
            })
            .map((pkg) => (
              <PackageCard key={pkg.projectId} pkg={pkg} />
            ))}
        </div>

        {/* DELTA info */}
        {!loading && packages.length > 0 && (
          <div
            style={{
              marginTop: 24,
              padding: "12px 16px",
              borderRadius: 3,
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              fontSize: 11,
              color: "var(--text-muted)",
            }}
          >
            <strong style={{ color: "var(--accent-cyan)" }}>DELTA</strong> — Release Manager. Owns the go/no-go process.
            Packages are generated live from DB readiness data, open bugs, and budget status. Refresh to recalculate.
          </div>
        )}
      </div>
    </AppShell>
  );
}
