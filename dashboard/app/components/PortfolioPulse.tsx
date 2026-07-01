"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ScoreRow {
  projectId: string;
  name: string;
  readiness: number;
  signal: string;
  priorityScore: number;
}

const SIGNAL_CLASS: Record<string, string> = {
  Ship: "mo-signal-Ship", Invest: "mo-signal-Invest", Fix: "mo-signal-Fix", Hold: "mo-signal-Hold", Cut: "mo-signal-Cut",
};

export default function PortfolioPulse() {
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [budget, setBudget] = useState<{ costUsd: number; capUsd: number } | null>(null);

  useEffect(() => {
    fetch("/api/priority").then((r) => r.json()).then((d) => setScores(d.scores ?? [])).catch(() => {});
    fetch("/api/budget").then((r) => r.json()).then(setBudget).catch(() => {});
  }, []);

  if (scores.length === 0) {
    return (
      <Link href="/launch" className="mo-card card-hover" style={{ display: "block", padding: 16, marginBottom: 16, textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div className="t-caption">PORTFOLIO READY</div>
            <div className="t-footnote" style={{ marginTop: 4, color: "var(--text-muted)" }}>
              Not scored yet — run a launch readiness scan
            </div>
          </div>
          <span className="mo-btn" style={{ fontSize: 11, padding: "6px 12px" }}>Scan →</span>
        </div>
      </Link>
    );
  }

  const avg = Math.round(scores.reduce((a, s) => a + s.readiness, 0) / scores.length);
  const ship = scores.filter((s) => s.signal === "Ship").length;
  const top = scores.slice(0, 4);

  return (
    <Link href="/launch" className="mo-card card-hover" style={{ display: "block", padding: 16, marginBottom: 16, textDecoration: "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <div>
            <div className="t-caption">PORTFOLIO READY</div>
            <div className="t-title2 t-num" style={{ color: "var(--text-primary)" }}>{avg}%</div>
          </div>
          <div>
            <div className="t-caption">SHIP-READY</div>
            <div className="t-title2 t-num" style={{ color: ship ? "var(--accent-green)" : "var(--text-primary)" }}>{ship}</div>
          </div>
          {budget && (
            <div>
              <div className="t-caption">SPEND TODAY</div>
              <div className="t-title2 t-num" style={{ color: "var(--text-primary)" }}>${budget.costUsd.toFixed(2)}<span className="t-footnote" style={{ color: "var(--text-muted)" }}> / ${budget.capUsd}</span></div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {top.map((s) => (
            <span key={s.projectId} className={`mo-signal-pill ${SIGNAL_CLASS[s.signal] ?? ""}`} style={{ fontSize: 10 }}>
              {s.name} {s.readiness}%
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
