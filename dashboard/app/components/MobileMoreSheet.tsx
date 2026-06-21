"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_MORE } from "../lib/nav";
import { badgeCount, type NavBadges } from "../lib/use-nav-badges";

interface MobileMoreSheetProps {
  open: boolean;
  onClose: () => void;
  badges: NavBadges;
}

export default function MobileMoreSheet({ open, onClose, badges }: MobileMoreSheetProps) {
  const pathname = usePathname();
  if (!open) return null;

  return (
    <>
      <button type="button" className="mo-drawer-backdrop" aria-label="Close menu" onClick={onClose} />
      <div className="mo-more-sheet" role="dialog" aria-labelledby="more-sheet-title">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 id="more-sheet-title" className="font-heading" style={{ fontSize: 18, margin: 0 }}>
            More
          </h2>
          <button type="button" className="mo-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <nav className="mo-more-grid" aria-label="More navigation">
          {MOBILE_MORE.map((item) => {
            const active = pathname === item.href;
            const count = badgeCount(badges, "badgeKey" in item ? item.badgeKey : undefined);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mo-more-link${active ? " active" : ""}`}
                onClick={onClose}
              >
                <span className="mo-more-icon">{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {count > 0 && <span className="mo-nav-badge">{count}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
