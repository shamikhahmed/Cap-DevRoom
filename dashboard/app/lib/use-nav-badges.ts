"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getTasks } from "./data";
import type { NavBadgeKey } from "./nav";

export interface NavBadges {
  bugs: number;
  approvals: number;
  tasks: number;
  issues: number;
  security: number;
}

export function useNavBadges(): NavBadges {
  const pathname = usePathname();
  const [badges, setBadges] = useState<NavBadges>({ bugs: 0, approvals: 0, tasks: 0, issues: 0, security: 0 });

  useEffect(() => {
    const tasks = getTasks();
    setBadges((b) => ({ ...b, tasks: tasks.filter((t) => t.status !== "done").length }));

    // Single health fetch gives approvals + openBugs (live DB counts)
    const refreshHealth = () =>
      fetch("/api/health")
        .then((r) => r.json())
        .then((h) => {
          setBadges((b) => ({
            ...b,
            approvals: h.pendingApprovals ?? 0,
            bugs: h.openBugs ?? 0,
          }));
        })
        .catch(() => {});

    // Security critical count
    fetch("/api/security")
      .then((r) => r.json())
      .then((d: { criticalCount?: number }) => setBadges((b) => ({ ...b, security: d.criticalCount ?? 0 })))
      .catch(() => {});

    refreshHealth();

    // Open issues count (not-done/canceled, any type)
    fetch("/api/issues")
      .then((r) => r.json())
      .then((d: { issues?: { status: string }[] }) => {
        const open = (d.issues ?? []).filter((i) => i.status !== "done" && i.status !== "canceled").length;
        setBadges((b) => ({ ...b, issues: open }));
      })
      .catch(() => {});

    const timer = setInterval(refreshHealth, 30_000);
    return () => clearInterval(timer);
  }, [pathname]);

  return badges;
}

export function badgeCount(badges: NavBadges, key?: NavBadgeKey): number {
  if (!key) return 0;
  return badges[key] ?? 0;
}
