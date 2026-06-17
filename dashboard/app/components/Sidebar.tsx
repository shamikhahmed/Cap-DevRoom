"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getProjects, getTasks } from "../lib/data";
import { BRAND } from "../lib/brand";
import { NAV_ITEMS, type NavBadgeKey } from "../lib/nav";
import { useTheme, type ThemeMode } from "./ThemeProvider";

interface Badges {
  bugs: number;
  approvals: number;
  tasks: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme, resolved } = useTheme();
  const [badges, setBadges] = useState<Badges>({ bugs: 0, approvals: 0, tasks: 0 });

  function cycleTheme() {
    const order: ThemeMode[] = ["dark", "light", "system"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  }

  useEffect(() => {
    const projects = getProjects();
    const tasks = getTasks();
    setBadges({
      bugs: projects.reduce((s, p) => s + p.openBugs, 0),
      approvals: 0,
      tasks: tasks.filter((t) => t.status !== "done").length,
    });
    fetch("/api/health")
      .then((r) => r.json())
      .then((h) => {
        setBadges((b) => ({ ...b, approvals: h.pendingApprovals ?? 0 }));
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <aside
      className="mo-sidebar"
      style={{
        width: 220,
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        backgroundColor: "var(--bg-secondary)",
        display: "flex",
        flexDirection: "column",
        padding: "16px 12px",
        gap: 4,
      }}
    >
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const badgeKey = "badgeKey" in item ? (item.badgeKey as NavBadgeKey) : undefined;
          const badgeVal = badgeKey ? badges[badgeKey] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                textDecoration: "none",
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                backgroundColor: active ? "var(--accent-soft)" : "transparent",
                borderRadius: "var(--radius-sm)",
                border: active ? "1px solid rgba(212,168,83,0.25)" : "1px solid transparent",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <span
                style={{
                  width: 22,
                  textAlign: "center",
                  fontSize: 14,
                  color: active ? "var(--accent)" : "var(--text-muted)",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {badgeVal > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    minWidth: 20,
                    height: 20,
                    padding: "0 6px",
                    borderRadius: 99,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      badgeKey === "approvals"
                        ? "rgba(224,112,112,0.15)"
                        : badgeKey === "bugs"
                          ? "rgba(212,168,83,0.15)"
                          : "rgba(110,181,217,0.15)",
                    color:
                      badgeKey === "approvals"
                        ? "var(--accent-red)"
                        : badgeKey === "bugs"
                          ? "var(--accent)"
                          : "var(--accent-cyan)",
                  }}
                >
                  {badgeVal}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div
        className="mo-card"
        style={{
          padding: "12px 14px",
          marginTop: 8,
          background: "var(--bg-card)",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>v{BRAND.version}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
          Cursor API connected · sandbox mode
        </div>
        <button
          type="button"
          className="mo-btn"
          onClick={cycleTheme}
          style={{ marginTop: 10, width: "100%", fontSize: 11 }}
          aria-label={`Theme: ${theme} (${resolved})`}
        >
          Theme: {resolved} · tap to switch
        </button>
      </div>
    </aside>
  );
}
