"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MOBILE_MORE, MOBILE_TABS } from "../lib/nav";
import MobileMoreSheet from "./MobileMoreSheet";
import { useJobLog } from "./JobLogContext";

export default function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { activeCount, openDrawer } = useJobLog();
  const moreActive = MOBILE_MORE.some((m) => m.href === pathname);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <>
      <nav className="mo-mobile-nav" aria-label="Mobile navigation">
        {MOBILE_TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={active ? "mo-mobile-nav-item active" : "mo-mobile-nav-item"}
            >
              <span className="mo-mobile-nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
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
          className={`mo-mobile-nav-item mo-mobile-nav-btn${moreActive ? " active" : ""}`}
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
        >
          <span className="mo-mobile-nav-icon">⋯</span>
          <span>More</span>
        </button>
      </nav>
      <MobileMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
