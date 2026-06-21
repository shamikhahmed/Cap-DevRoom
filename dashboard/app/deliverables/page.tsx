"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { BRAND } from "../lib/brand";

interface Hit {
  projectId: string;
  kind: string;
  relativePath: string;
  sizeBytes: number;
  modifiedAt: string;
}

const KIND_COLOR: Record<string, string> = {
  readme: "var(--accent-cyan)",
  pitch: "var(--accent-amber)",
  presentation: "#bc8cff",
  changelog: "var(--accent-green)",
  docs: "var(--text-secondary)",
};

export default function DeliverablesPage() {
  const [hits, setHits] = useState<Hit[]>([]);
  const [summary, setSummary] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [scannedAt, setScannedAt] = useState<string | null>(null);

  function scan() {
    setLoading(true);
    fetch("/api/scan/deliverables")
      .then((r) => r.json())
      .then((d) => {
        setHits(d.hits || []);
        setSummary(d.summary || {});
        setScannedAt(new Date().toLocaleString());
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    scan();
  }, []);

  const projects = Object.keys(summary);

  return (
    <AppShell>
      <div className="mo-page" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 20 }}>
          <div className="mo-eyebrow">Deliverables</div>
          <h1 className="mo-title">README · Pitch · Presentations</h1>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
            Scans sandbox copies. After fixing apps elsewhere, run{" "}
            <code style={{ color: "var(--accent)" }}>npm run sync:sandboxes</code> then rescan to pick up changes.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" className="mo-btn mo-btn-primary" onClick={scan} disabled={loading}>
              {loading ? "Scanning…" : "Rescan portfolio"}
            </button>
            {scannedAt && (
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Last scan: {scannedAt}</span>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ color: "var(--text-muted)" }}>Scanning sandboxes…</div>
        ) : projects.length === 0 ? (
          <div
            style={{
              padding: "24px",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
            }}
          >
            <p style={{ color: "var(--accent-amber)", marginBottom: "12px" }}>No sandboxes found.</p>
            <pre style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Run: ~/Cap-DevRoom/scripts/sync-sandboxes.sh
            </pre>
          </div>
        ) : (
          <>
            <div className="mo-deliverables-grid" style={{ marginBottom: "24px" }}>
              {projects.map((pid) => (
                <div
                  key={pid}
                  style={{
                    padding: "14px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--accent-cyan)", marginBottom: "8px" }}>{pid}</div>
                  {Object.entries(summary[pid] || {}).map(([kind, n]) => (
                    <div key={kind} style={{ fontSize: "10px", color: KIND_COLOR[kind] || "var(--text-muted)" }}>
                      {kind}: {n}
                    </div>
                  ))}
                  {!summary[pid]?.pitch && (
                    <div style={{ fontSize: "9px", color: "var(--accent-red)", marginTop: "6px" }}>⚠ No pitch file</div>
                  )}
                  {!summary[pid]?.readme && (
                    <div style={{ fontSize: "9px", color: "var(--accent-amber)", marginTop: "4px" }}>⚠ No README</div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ fontSize: "9px", letterSpacing: "2px", color: "var(--text-muted)", marginBottom: "10px" }}>
              ALL FILES ({hits.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {hits.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "10px 14px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    fontSize: "11px",
                  }}
                >
                  <span style={{ color: KIND_COLOR[h.kind], width: "90px", flexShrink: 0, textTransform: "uppercase", fontSize: "9px" }}>
                    {h.kind}
                  </span>
                  <span style={{ color: "var(--accent-cyan)", width: "100px", flexShrink: 0 }}>{h.projectId}</span>
                  <span style={{ color: "var(--text-secondary)", flex: 1 }}>{h.relativePath}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "9px" }}>
                    {new Date(h.modifiedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
