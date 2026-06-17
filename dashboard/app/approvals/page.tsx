"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/AppShell";

type RiskTier = "Low" | "Medium" | "High";
type ApprovalStatus = "pending" | "approved" | "rejected";

interface Approval {
  id: string;
  title: string;
  description: string;
  agent: string;
  projectId: string;
  risk: RiskTier;
  status: ApprovalStatus;
  createdAt: string;
  source?: "demo" | "agent";
}

const RISK_CONFIG: Record<RiskTier, { color: string; bg: string; border: string; icon: string }> = {
  Low: { color: "var(--accent-green)", bg: "rgba(92,184,138,0.08)", border: "rgba(92,184,138,0.25)", icon: "▽" },
  Medium: { color: "#bc8cff", bg: "rgba(188,140,255,0.08)", border: "rgba(188,140,255,0.25)", icon: "◇" },
  High: { color: "var(--accent-red)", bg: "rgba(224,112,112,0.08)", border: "rgba(224,112,112,0.25)", icon: "▲" },
};

function RiskBadge({ risk }: { risk: RiskTier }) {
  const c = RISK_CONFIG[risk];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        padding: "3px 8px",
        borderRadius: 6,
        backgroundColor: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        fontWeight: 600,
        textTransform: "uppercase",
      }}
    >
      {c.icon} {risk}
    </span>
  );
}

function ApprovalCard({
  approval,
  onDecide,
  busy,
}: {
  approval: Approval;
  onDecide: (id: string, d: "approved" | "rejected") => void;
  busy: string | null;
}) {
  const isPending = approval.status === "pending";
  const agentColor = "var(--accent)";

  return (
    <div className="mo-card" style={{ padding: 18, borderColor: approval.risk === "High" && isPending ? "rgba(224,112,112,0.3)" : undefined }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.35 }}>{approval.title}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
            {approval.agent} · {approval.projectId}
            {approval.source === "demo" && " · sample queue"}
            {approval.source === "agent" && " · from agent run"}
          </div>
        </div>
        <RiskBadge risk={approval.risk} />
      </div>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, margin: "0 0 14px" }}>{approval.description}</p>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {isPending ? (
          <>
            <button type="button" className="mo-btn mo-btn-primary" disabled={busy === approval.id} onClick={() => onDecide(approval.id, "approved")}>
              {busy === approval.id ? "Starting agent…" : "Approve & run"}
            </button>
            <button type="button" className="mo-btn" disabled={busy === approval.id} onClick={() => onDecide(approval.id, "rejected")}>
              Reject
            </button>
          </>
        ) : (
          <span style={{ fontSize: 12, color: approval.status === "approved" ? "var(--accent-green)" : "var(--accent-red)" }}>
            {approval.status === "approved" ? "Approved" : "Rejected"}
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>{approval.createdAt}</span>
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [filter, setFilter] = useState<"pending" | "all" | "approved" | "rejected">("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [runNotice, setRunNotice] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/approvals");
    const d = await r.json();
    setApprovals(d.approvals || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(id: string, decision: "approved" | "rejected") {
    setBusy(id);
    try {
      const res = await fetch("/api/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: decision }),
      });
      const data = await res.json();
      if (data.run?.message && decision === "approved") {
        setRunNotice(data.run.message);
      }
      await load();
    } finally {
      setBusy(null);
    }
  }

  const filtered = filter === "all" ? approvals : approvals.filter((a) => a.status === filter);
  const counts = {
    all: approvals.length,
    pending: approvals.filter((a) => a.status === "pending").length,
    approved: approvals.filter((a) => a.status === "approved").length,
    rejected: approvals.filter((a) => a.status === "rejected").length,
  };

  return (
    <AppShell>
      <div className="mo-page" style={{ maxWidth: 860 }}>
        <div className="mo-eyebrow">Approvals</div>
        <h1 className="mo-title" style={{ marginBottom: 8 }}>
          {counts.pending} pending
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.55 }}>
          Approve to launch the assigned agent in your sandbox. Progress appears on Home under each agent. Requires{" "}
          <code style={{ color: "var(--accent)" }}>CURSOR_API_KEY</code> and synced sandboxes.
        </p>
        {runNotice && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              borderRadius: 8,
              border: "1px solid rgba(92,184,138,0.35)",
              background: "rgba(92,184,138,0.08)",
              fontSize: 12,
              color: "var(--accent-green)",
            }}
          >
            {runNotice}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {(["pending", "all", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? "mo-btn mo-btn-primary" : "mo-btn"}
              onClick={() => setFilter(f)}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 && (
            <div className="mo-card" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No {filter !== "all" ? filter : ""} approvals.{" "}
              <button type="button" className="mo-btn" style={{ marginTop: 12 }} onClick={async () => { await fetch("/api/approvals/reset", { method: "POST" }); load(); }}>
                Restore sample queue
              </button>
            </div>
          )}
          {filtered.map((approval) => (
            <ApprovalCard key={approval.id} approval={approval} onDecide={decide} busy={busy} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
