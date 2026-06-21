"use client";

import { useState } from "react";
import { PORTFOLIO_APP_IDS } from "../lib/portfolio";
import { useJobLog } from "./JobLogContext";

interface Assignment {
  agent: string;
  task: string;
  project: string;
  risk: string;
  reason: string;
}

export default function CeoCommand() {
  const { openDrawer } = useJobLog();
  const [command, setCommand] = useState("");
  const [projectId, setProjectId] = useState("VaultCap");
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [message, setMessage] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState("");
  const [runResults, setRunResults] = useState<Record<string, string>>({});

  async function submit() {
    if (!command.trim()) return;
    setLoading(true);
    setError("");
    setRunResults({});
    try {
      const res = await fetch("/api/ceo/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Command failed");
      setGreeting(data.greeting || "");
      setMessage(data.message || "");
      setAssignments(data.assignments || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function runAssignment(a: Assignment) {
    const key = a.agent + a.task.slice(0, 20);
    setRunResults((r) => ({ ...r, [key]: "Running…" }));
    try {
      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codename: a.agent,
          task: a.task,
          projectId: a.project,
        }),
      });
      const data = await res.json();
      if (data.needsApproval) {
        setRunResults((r) => ({
          ...r,
          [key]: `⏳ Queued for approval (${data.approvalId})`,
        }));
      } else if (data.ok) {
        setRunResults((r) => ({
          ...r,
          [key]: data.output?.slice(0, 500) || "Done",
        }));
        if (data.jobId) openDrawer(data.jobId);
      } else {
        setRunResults((r) => ({ ...r, [key]: `Error: ${data.error}` }));
      }
    } catch (e) {
      setRunResults((r) => ({
        ...r,
        [key]: e instanceof Error ? e.message : "Failed",
      }));
    }
  }

  return (
    <div className="mo-card" style={{ marginBottom: 20, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px" }}>
        <div className="mo-section-label" style={{ marginBottom: 12 }}>
          CEO command · APEX
        </div>
        {greeting && (
          <div className="font-heading" style={{ fontSize: 18, color: "var(--accent)", marginBottom: 10 }}>
            {greeting}
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
            }}
          >
            {PORTFOLIO_APP_IDS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          placeholder="Tell APEX what you need — e.g. audit PulseCap home screen fonts, check VaultCap pitch deck, polish ScentCap mobile layout…"
          rows={3}
          className="mo-input"
          style={{
            width: "100%",
            marginBottom: 12,
            minHeight: 88,
            resize: "vertical",
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={submit}
          disabled={loading}
          className="mo-btn mo-btn-primary btn-scan"
          style={{ cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "APEX is thinking…" : "Delegate to office"}
        </button>
        <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8, marginBottom: 0 }}>
          Tip: ⌘+Enter to delegate
        </p>
        {error && (
          <div style={{ marginTop: "12px", fontSize: "11px", color: "var(--accent-red)" }}>{error}</div>
        )}
        {message && (
          <p style={{ marginTop: "14px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {message}
          </p>
        )}
        {assignments.length > 0 && (
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {assignments.map((a, i) => {
              const key = a.agent + a.task.slice(0, 20);
              return (
                <div
                  key={i}
                  style={{
                    padding: "12px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                  }}
                >
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 700, color: "var(--accent-cyan)", fontSize: "11px" }}>{a.agent}</span>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{a.project}</span>
                    <span
                      style={{
                        fontSize: "8px",
                        padding: "2px 6px",
                        borderRadius: "2px",
                        marginLeft: "auto",
                        color: a.risk === "High" ? "var(--accent-red)" : a.risk === "Medium" ? "#bc8cff" : "var(--accent-green)",
                        border: "1px solid currentColor",
                      }}
                    >
                      {a.risk}
                    </span>
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "8px" }}>{a.task}</div>
                  <button
                    type="button"
                    onClick={() => runAssignment(a)}
                    className="mo-btn mo-btn-primary"
                    style={{ fontSize: 11, padding: "6px 12px" }}
                  >
                    {a.risk === "Low" ? "Run now" : "Queue / run"}
                  </button>
                  {runResults[key] && (
                    <pre
                      style={{
                        marginTop: "8px",
                        fontSize: "9px",
                        color: "var(--text-muted)",
                        whiteSpace: "pre-wrap",
                        maxHeight: "120px",
                        overflow: "auto",
                      }}
                    >
                      {runResults[key]}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
