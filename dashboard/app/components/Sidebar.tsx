"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "../lib/brand";
import { NAV_ITEMS, type NavBadgeKey } from "../lib/nav";
import { badgeCount, useNavBadges } from "../lib/use-nav-badges";
import { useTheme, type ThemeMode } from "./ThemeProvider";

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme, resolved } = useTheme();
  const badges = useNavBadges();

  function cycleTheme() {
    const order: ThemeMode[] = ["dark", "light", "system"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  }

  return (
    <aside className="mo-sidebar">
      <nav className="mo-sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));
          const badgeKey = "badgeKey" in item ? (item.badgeKey as NavBadgeKey) : undefined;
          const badgeVal = badgeCount(badges, badgeKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mo-nav-link${active ? " active" : ""}`}
            >
              <span className="mo-nav-icon">{item.icon}</span>
              <span className="mo-nav-label">{item.label}</span>
              {badgeVal > 0 && (
                <span className={`mo-nav-count mo-nav-count-${badgeKey ?? "tasks"}`}>
                  {badgeVal}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mo-card mo-sidebar-footer">
        <div className="mo-sidebar-version">v{BRAND.version}</div>
        <div className="mo-sidebar-meta">Cursor API connected · sandbox mode</div>
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
