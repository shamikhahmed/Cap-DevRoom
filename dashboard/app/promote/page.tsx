"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { PORTFOLIO_APP_IDS } from "../lib/portfolio";

interface DiffFile {
  path: string;
  status: "added" | "modified" | "deleted";
}

export default function PromotePage() {
  const [projectId, setProjectId] = useState("VaultCap");
  const [files, setFiles] = useState<DiffFile[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadDiff() {
    setLoading(true);
    setMessage("");
    try {
      const d = await fetch(`/api/promote?projectId=${encodeURIComponent(projectId)}`).then((r) => r.json());
      setFiles(d.files ?? []);
      setCount(d.count ?? 0);
    } catch {
      setMessage("Failed to load diff");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDiff();
  }, [projectId]);

  async function promote() {
    if (!confirm(`Promote ${count} file(s) from sandbox to ~/Desktop/Projects/${projectId}?`)) return;
    setLoading(true);
    try {
      const r = await fetch("/api/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply", projectId, confirm: true }),
      }).then((res) => res.json());
      setMessage(r.ok ? `Promoted ${r.copied} file(s)` : r.error || "Failed");
      await loadDiff();
    } finally {
      setLoading(false);
    }
  }

  async function discard() {
    if (!confirm(`Discard all sandbox changes for ${projectId}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await fetch("/api/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discard", projectId, confirm: true }),
      });
      setMessage("Sandbox reset from Projects");
      await loadDiff();
    } finally {
      setLoading(false);
    }
  }

  async function openCloudPr() {
    setLoading(true);
    try {
      const r = await fetch("/api/agent/cloud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codename: "FORGE",
          projectId,
          task: `[Cloud] Apply reviewed sandbox changes for ${projectId}`,
          createPR: true,
        }),
      }).then((res) => res.json());
      setMessage(r.ok ? "Cloud agent started — check GitHub for PR" : r.error || "Cloud run failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mo-page" style={{ maxWidth: 900 }}>
        <div className="mo-eyebrow">Release Office</div>
        <h1 className="mo-title">Promote sandbox changes</h1>
        <p className="t-subhead" style={{ marginTop: 6, marginBottom: 20 }}>
          Review diffs between sandboxes/ and ~/Desktop/Projects before shipping.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <select
            className="mo-btn"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={{ padding: "8px 12px" }}
          >
            {PORTFOLIO_APP_IDS.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
          <button type="button" className="mo-btn" disabled={loading} onClick={() => void loadDiff()}>Refresh</button>
          <button type="button" className="mo-btn" disabled={loading || count === 0} onClick={() => void promote()}>
            Promote to Projects
          </button>
          <button type="button" className="mo-btn" disabled={loading} onClick={() => void openCloudPr()}>
            Open Cloud PR
          </button>
          <button type="button" className="mo-btn" disabled={loading || count === 0} onClick={() => void discard()}>
            Discard sandbox
          </button>
        </div>

        {message && <div className="t-footnote" style={{ marginBottom: 12, color: "var(--accent-cyan)" }}>{message}</div>}

        <div className="mo-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <span className="t-caption">{count} changed file{count !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ maxHeight: 480, overflowY: "auto" }}>
            {files.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
                {loading ? "Loading…" : "Sandbox matches Projects — nothing to promote"}
              </div>
            ) : (
              files.map((f) => (
                <div key={f.path} style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)", fontSize: 11, fontFamily: "var(--font-data)" }}>
                  <span style={{ color: f.status === "deleted" ? "var(--accent-red)" : f.status === "added" ? "var(--accent-green)" : "var(--accent-amber)", marginRight: 8 }}>
                    {f.status.toUpperCase()}
                  </span>
                  {f.path}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
