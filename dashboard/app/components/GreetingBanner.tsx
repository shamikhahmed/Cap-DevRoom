"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND } from "../lib/brand";
import { computePortfolioMetrics, initStorage } from "../lib/data";
import { syncFromServer } from "../lib/server-sync";

function timeGreeting(): { greet: string; period: "morning" | "afternoon" | "evening" | "night" } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { greet: "Good morning", period: "morning" };
  if (h >= 12 && h < 17) return { greet: "Good afternoon", period: "afternoon" };
  if (h >= 17 && h < 22) return { greet: "Good evening", period: "evening" };
  return { greet: "Working late", period: "night" };
}

export default function GreetingBanner() {
  const [text, setText] = useState("");
  const [sub, setSub] = useState("");
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [openBugs, setOpenBugs] = useState(0);

  useEffect(() => {
    const { greet, period } = timeGreeting();
    setText(`${greet}, Shamikh.`);

    async function load() {
      initStorage();
      await syncFromServer();
      const m = computePortfolioMetrics();
      setOpenBugs(m.openBugs);

      try {
        const h = await fetch("/api/health").then((r) => r.json());
        setPendingApprovals(h.pendingApprovals ?? m.pendingApprovals);
      } catch {
        setPendingApprovals(m.pendingApprovals);
      }

      const subs: Record<string, string> = {
        morning: "APEX has your briefing ready. Clear approvals before deep work.",
        afternoon: "Midday pulse across the portfolio.",
        evening: "Evening review window. Low-risk sandbox tasks can run unattended.",
        night: "Night shift mode. Only critical items need your attention.",
      };
      setSub(subs[period]);
    }

    void load();
  }, []);

  return (
    <div className="mo-card mo-greeting-banner">
      <div className="font-heading mo-greeting-title">{text}</div>
      <div className="mo-greeting-sub">{sub}</div>

      {(pendingApprovals > 0 || openBugs > 0) && (
        <div className="mo-greeting-chips">
          {pendingApprovals > 0 && (
            <Link href="/approvals" className="mo-greeting-chip mo-greeting-chip-warn">
              {pendingApprovals} approval{pendingApprovals !== 1 ? "s" : ""} pending
            </Link>
          )}
          {openBugs > 0 && (
            <Link href="/projects" className="mo-greeting-chip">
              {openBugs} open bug{openBugs !== 1 ? "s" : ""}
            </Link>
          )}
        </div>
      )}

      <div className="mo-greeting-meta">
        {BRAND.name} · local sandbox copies only · agents run on your Mac
      </div>
    </div>
  );
}
