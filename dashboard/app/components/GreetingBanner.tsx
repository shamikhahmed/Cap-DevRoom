"use client";

import { useEffect, useState } from "react";
import { BRAND } from "../lib/brand";

function timeGreeting(): { greet: string; period: "morning" | "afternoon" | "evening" | "night" } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return { greet: "Good morning", period: "morning" };
  if (h >= 12 && h < 17) return { greet: "Good afternoon", period: "afternoon" };
  if (h >= 17 && h < 22) return { greet: "Good evening", period: "evening" };
  return { greet: "Working late", period: "night" };
}

export default function GreetingBanner() {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("");
  const [sub, setSub] = useState("");

  useEffect(() => {
    const { greet, period } = timeGreeting();
    const subs: Record<string, string> = {
      morning: "APEX has your briefing ready. Check Deliverables and Approvals first.",
      afternoon: "Midday pulse — pending approvals and open bugs across the portfolio.",
      evening: "Evening review window. Low-risk tasks can run on sandbox copies.",
      night: "Night shift mode. Only critical alerts will ping you.",
    };
    setText(`${greet}, Shamikh.`);
    setSub(subs[period]);
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="mo-card"
      style={{
        padding: "20px 24px",
        background: "linear-gradient(135deg, rgba(212,168,83,0.08), rgba(17,20,26,0.6))",
        borderColor: "rgba(212,168,83,0.2)",
      }}
    >
      <div className="font-heading" style={{ fontSize: 22, color: "var(--text-primary)" }}>
        {text}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.55, maxWidth: 560 }}>
        {sub}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
        {BRAND.name} · local sandbox copies only · agents run on your Mac
      </div>
    </div>
  );
}
