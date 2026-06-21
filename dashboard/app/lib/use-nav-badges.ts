"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getProjects, getTasks } from "./data";
import type { NavBadgeKey } from "./nav";

export interface NavBadges {
  bugs: number;
  approvals: number;
  tasks: number;
  issues: number;
}

export function useNavBadges(): NavBadges {
  const pathname = usePathname();
  const [badges, setBadges] = useState<NavBadges>({ bugs: 0, approvals: 0, tasks: 0, issues: 0 });

  useEffect(() => {
    const projects = getProjects();
    const tasks = getTasks();
    setBadges((b) => ({
      ...b,
      bugs: projects.reduce((s, p) => s + p.openBugs, 0),
      tasks: tasks.filter((t) => t.status !== "done").length,
    }));

    fetch("/api/issues")
      .then((r) => r.json())
      .then((d: { issues?: { status: string }[] }) => {
        const open = (d.issues ?? []).filter((i) => i.status !== "done" && i.status !== "canceled").length;
        setBadges((b) => ({ ...b, issues: open }));
      })
      .catch(() => {});

    fetch("/api/health")
      .then((r) => r.json())
      .then((h) => {
        setBadges((b) => ({ ...b, approvals: h.pendingApprovals ?? 0 }));
      })
      .catch(() => {});

    const timer = setInterval(() => {
      fetch("/api/health")
        .then((r) => r.json())
        .then((h) => {
          setBadges((b) => ({ ...b, approvals: h.pendingApprovals ?? 0 }));
        })
        .catch(() => {});
    }, 30_000);

    return () => clearInterval(timer);
  }, [pathname]);

  return badges;
}

export function badgeCount(badges: NavBadges, key?: NavBadgeKey): number {
  if (!key) return 0;
  return badges[key] ?? 0;
}
