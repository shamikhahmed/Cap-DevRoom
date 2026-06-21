"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Alert {
  id: string;
  severity: "critical" | "high" | "medium";
  title: string;
  detail: string;
  href: string;
  source: string;
}

const SEV_COLOR: Record<string, string> = {
  critical: "var(--accent-red)",
  high: "#ff8c42",
  medium: "var(--accent-amber)",
};

export default function CriticalAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const next: Alert[] = [];

      // Security criticals
      try {
        const d = await fetch("/api/security").then((r) => r.json());
        if (d.criticalCount > 0) {
          next.push({
            id: "sec.critical",
            severity: "critical",
            title: `${d.criticalCount} app(s) with critical security findings`,
            detail: d.projectsAtRisk?.join(", ") ?? "",
            href: "/security",
            source: "VAULT",
          });
        }
      } catch { /* offline */ }

      // Pending approvals
      try {
        const h = await fetch("/api/health").then((r) => r.json());
        if (h.pendingApprovals > 0) {
          next.push({
            id: "approvals.pending",
            severity: h.pendingApprovals >= 3 ? "high" : "medium",
            title: `${h.pendingApprovals} pending approval(s) need your attention`,
            detail: "Agent runs awaiting founder sign-off",
            href: "/approvals",
            source: "APEX",
          });
        }
      } catch { /* offline */ }

      // Launch blockers
      try {
        const d = await fetch("/api/priority").then((r) => r.json());
        const blockers = (d.scores ?? []).filter((s: { fails: number; signal: string }) => s.fails >= 3 || s.signal === "NO_GO");
        if (blockers.length > 0) {
          next.push({
            id: "launch.blockers",
            severity: "high",
            title: `${blockers.length} app(s) have launch blockers`,
            detail: blockers.map((b: { name: string }) => b.name).join(", "),
            href: "/launch",
            source: "DELTA",
          });
        }
      } catch { /* offline */ }

      setAlerts(next);
    }
    void load();
  }, []);

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
      {visible.map((alert) => (
        <div key={alert.id} style={{
          display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
          borderRadius: "var(--radius-sm)", border: `1px solid ${SEV_COLOR[alert.severity]}40`,
          backgroundColor: `${SEV_COLOR[alert.severity]}0c`,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: SEV_COLOR[alert.severity], flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: SEV_COLOR[alert.severity] }}>{alert.title}</div>
            {alert.detail && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{alert.detail}</div>}
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: "var(--text-muted)", padding: "1px 5px", borderRadius: 4, border: "0.5px solid var(--border)" }}>{alert.source}</span>
            <Link href={alert.href} style={{ fontSize: 11, color: SEV_COLOR[alert.severity], textDecoration: "none", padding: "2px 8px", borderRadius: 4, border: `1px solid ${SEV_COLOR[alert.severity]}40` }}>
              View →
            </Link>
            <button onClick={() => setDismissed((s) => new Set([...s, alert.id]))} style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}
