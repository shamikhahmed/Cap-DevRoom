"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { JobLogProvider, useJobLog } from "./JobLogContext";
import { BRAND } from "../lib/brand";
import { initStorage } from "../lib/data";
import { syncFromServer } from "../lib/server-sync";
import ApiStatusBanner from "./ApiStatusBanner";

function DevRoomLogo() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: "linear-gradient(145deg, rgba(212,168,83,0.2), rgba(212,168,83,0.06))",
        border: "1px solid rgba(212,168,83,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        className="font-heading"
        style={{ fontSize: 16, color: "var(--accent)", lineHeight: 1, fontWeight: 800 }}
      >
        D
      </span>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <JobLogProvider>
      <AppShellInner>{children}</AppShellInner>
    </JobLogProvider>
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,168,83,0.06), transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <header
        style={{
          height: 56,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 20,
          backgroundColor: "rgba(17, 20, 26, 0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
          position: "relative",
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <DevRoomLogo />
          <div>
            <div className="font-heading" style={{ fontSize: 17, color: "var(--text-primary)", lineHeight: 1.2 }}>
              {BRAND.displayName}
            </div>
            <div className="mo-header-brand-sub" style={{ fontSize: 11, color: "var(--text-muted)" }}>{BRAND.tagline}</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div className="mo-header-status" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <JobLogHeaderButton />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              className={online ? "status-pulse" : undefined}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: online ? "var(--accent-green)" : "var(--accent-amber)",
              }}
            />
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {online ? "Online" : "Degraded"}
            </span>
          </div>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <div style={{ textAlign: "right" }}>
            <div className="font-data" style={{ fontSize: 15, color: "var(--text-primary)" }}>
              {timeStr}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{dateStr}</div>
          </div>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative", zIndex: 1 }}>
        <Sidebar />
        <main
          key={pathname}
          className="page-enter mo-main"
          style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--bg-primary)" }}
        >
          <div style={{ paddingTop: 16 }}>
            <ApiStatusBanner />
          </div>
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
