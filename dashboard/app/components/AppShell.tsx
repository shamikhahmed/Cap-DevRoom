"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { JobLogProvider, useJobLog } from "./JobLogContext";
import { ToastProvider } from "./Toast";
import CommandPalette from "./CommandPalette";
import { BRAND } from "../lib/brand";
import { initStorage } from "../lib/data";
import { syncFromServer } from "../lib/server-sync";
import ApiStatusBanner from "./ApiStatusBanner";

function DevRoomLogo() {
  return (
    <div className="mo-brand-mark">
      <span className="font-heading mo-brand-letter">D</span>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <JobLogProvider>
        <CommandPalette />
        <AppShellInner>{children}</AppShellInner>
      </JobLogProvider>
    </ToastProvider>
  );
}

function JobLogHeaderButton() {
  const { activeCount, openDrawer } = useJobLog();
  return (
    <button
      type="button"
      className="mo-header-jobs-btn mo-desktop-only"
      onClick={() => openDrawer()}
      aria-label={`Open agent jobs${activeCount ? `, ${activeCount} active` : ""}`}
    >
      Jobs
      {activeCount > 0 && <span className="mo-nav-badge">{activeCount}</span>}
    </button>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [now, setNow] = useState<Date | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    initStorage();
    syncFromServer();
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);

    const probe = () => {
      fetch("/api/health", { cache: "no-store" })
        .then((r) => r.json())
        .then((h) => setOnline(h.ok !== false && h.database !== "unavailable"))
        .catch(() => setOnline(false));
    };
    probe();
    const healthTimer = setInterval(probe, 20_000);

    return () => {
      clearInterval(timer);
      clearInterval(healthTimer);
    };
  }, []);

  const timeStr = now
    ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  const dateStr = now
    ? now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    : "";

  return (
    <div className="mo-app-shell">
      <header className="mo-shell-header">
        <div className="mo-header-brand">
          <DevRoomLogo />
          <div>
            <div className="font-heading mo-header-title">{BRAND.displayName}</div>
            <div className="mo-header-brand-sub">{BRAND.tagline}</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div className="mo-header-status-mobile" aria-label={online ? "Server online" : "Server degraded"}>
          <span
            className={online ? "status-pulse mo-status-dot-inline" : "mo-status-dot-inline"}
            style={{
              backgroundColor: online ? "var(--accent-green)" : "var(--accent-amber)",
            }}
          />
        </div>

        <div className="mo-header-status">
          <button
            type="button"
            className="mo-cmdk-trigger mo-desktop-only"
            onClick={() => window.dispatchEvent(new CustomEvent("devroom:open-cmdk"))}
            aria-label="Open command palette"
          >
            <span>Search</span>
            <kbd>⌘K</kbd>
          </button>
          <JobLogHeaderButton />
          <div className="mo-status-pill">
            <span
              className={online ? "status-pulse mo-status-dot-inline" : "mo-status-dot-inline"}
              style={{
                backgroundColor: online ? "var(--accent-green)" : "var(--accent-amber)",
              }}
            />
            <span>{online ? "Online" : "Degraded"}</span>
          </div>
          <div className="mo-header-divider" />
          <div className="mo-header-clock">
            <div className="font-data mo-header-time">{timeStr}</div>
            <div className="mo-header-date">{dateStr}</div>
          </div>
        </div>
      </header>

      <div className="mo-body-row">
        <Sidebar />
        <main key={pathname} className="mo-main page-enter">
          <div className="mo-main-inner">
            <ApiStatusBanner />
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
