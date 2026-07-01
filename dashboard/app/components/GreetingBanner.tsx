"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND } from "../lib/brand";

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
  const [activeJobs, setActiveJobs] = useState(0);
  const [hasBriefingToday, setHasBriefingToday] = useState(false);

  useEffect(() => {
    const { greet, period } = timeGreeting();
    setText(`${greet}, Shamikh.`);

    async function load() {
      const today = new Date().toISOString().slice(0, 10);

      try {
        const [h, jobs, briefings] = await Promise.all([
          fetch("/api/health").then((r) => r.json()),
          fetch("/api/jobs").then((r) => r.json()),
          fetch("/api/briefings").then((r) => r.json()).catch(() => ({ briefings: [] })),
        ]);

        setPendingApprovals(h.pendingApprovals ?? 0);
        setOpenBugs(h.openBugs ?? 0);

        const processing = (jobs.jobs ?? []).filter(
          (j: { status: string }) => j.status === "PROCESSING" || j.status === "PENDING"
        ).length;
        setActiveJobs(processing);

        const briefs = briefings.briefings ?? briefings ?? [];
        const todayBrief = Array.isArray(briefs)
          ? briefs.some((b: { dateKey?: string }) => b.dateKey === today)
          : false;
        setHasBriefingToday(todayBrief);

        if (processing > 0) {
          setSub(`${processing} agent job${processing !== 1 ? "s" : ""} in the queue.`);
        } else if (todayBrief) {
          setSub("APEX briefing is ready — review on /briefing.");
        } else if (period === "morning") {
          setSub("No briefing yet today — generate one from /briefing.");
        } else if (period === "afternoon") {
          setSub("Midday pulse across the portfolio.");
        } else if (period === "evening") {
          setSub("Evening review window. Low-risk sandbox tasks can run unattended.");
        } else {
          setSub("Night shift mode. Only critical items need your attention.");
        }
      } catch {
        setSub("Connect to the local dashboard to see live office status.");
      }
    }

    void load();
  }, []);

  return (
    <div className="mo-card mo-greeting-banner">
      <div className="font-heading mo-greeting-title">{text}</div>
      <div className="mo-greeting-sub">{sub}</div>

      {(pendingApprovals > 0 || openBugs > 0 || activeJobs > 0) && (
        <div className="mo-greeting-chips">
          {activeJobs > 0 && (
            <span className="mo-greeting-chip" style={{ borderColor: "var(--accent-green)" }}>
              {activeJobs} running
            </span>
          )}
          {pendingApprovals > 0 && (
            <Link href="/approvals" className="mo-greeting-chip mo-greeting-chip-warn">
              {pendingApprovals} approval{pendingApprovals !== 1 ? "s" : ""} pending
            </Link>
          )}
          {openBugs > 0 && (
            <Link href="/issues" className="mo-greeting-chip">
              {openBugs} open bug{openBugs !== 1 ? "s" : ""}
            </Link>
          )}
        </div>
      )}

      <div className="mo-greeting-meta">
        {BRAND.name} · local sandbox copies only · agents run on your Mac
        {hasBriefingToday ? " · briefing today" : ""}
      </div>
    </div>
  );
}
