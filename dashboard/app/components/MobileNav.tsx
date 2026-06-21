"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MOBILE_MORE, MOBILE_TABS } from "../lib/nav";
import { badgeCount, useNavBadges } from "../lib/use-nav-badges";
import MobileMoreSheet from "./MobileMoreSheet";
import { useJobLog } from "./JobLogContext";

export default function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { activeCount, openDrawer } = useJobLog();
  const badges = useNavBadges();
  const moreActive = MOBILE_MORE.some((m) => m.href === pathname);
  const moreBadgeTotal = MOBILE_MORE.reduce(
    (sum, item) => sum + badgeCount(badges, "badgeKey" in item ? item.badgeKey : undefined),
    0
  );

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <>
      <nav className="mo-mobile-nav" aria-label="Mobile navigation">
        {MOBILE_TABS.map((tab) => {
          const active = pathname === tab.href;
          const tabBadge = badgeCount(badges, "badgeKey" in tab ? tab.badgeKey : undefined);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`mo-mobile-nav-item${active ? " active" : ""}${tabBadge > 0 ? " has-badge" : ""}`}
            >
              <span className="mo-mobile-nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
              {tabBadge > 0 && <span className="mo-nav-badge">{tabBadge}</span>}
            </Link>
          );
        })}
        <button
          type="button"
          className={`mo-mobile-nav-item mo-mobile-nav-btn${activeCount > 0 ? " has-badge" : ""}`}
          onClick={() => openDrawer()}
          aria-label={`Agent jobs${activeCount ? `, ${activeCount} active` : ""}`}
        >
          <span className="mo-mobile-nav-icon">▤</span>
          <span>Jobs</span>
          {activeCount > 0 && <span className="mo-nav-badge">{activeCount}</span>}
        </button>
        <button
          type="button"
          className={`mo-mobile-nav-item mo-mobile-nav-btn${moreActive ? " active" : ""}${moreBadgeTotal > 0 ? " has-badge" : ""}`}
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
          aria-label={`More menu${moreBadgeTotal ? `, ${moreBadgeTotal} notifications` : ""}`}
        >
          <span className="mo-mobile-nav-icon">⋯</span>
          <span>More</span>
          {moreBadgeTotal > 0 && <span className="mo-nav-badge">{moreBadgeTotal}</span>}
        </button>
      </nav>
      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} badges={badges} />
    </>
  );
}
