"use client";

import { useEffect, useState } from "react";

type HealthState = {
  down: boolean;
  cursorApi?: string;
  database?: string;
};

export default function ApiStatusBanner() {
  const [health, setHealth] = useState<HealthState>({ down: false });

  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setHealth({ down: true });
          return;
        }
        const body = await res.json();
        if (!cancelled) {
          const dbDown = body.database === "unavailable";
          const keyMissing = body.cursorApi === "missing";
          setHealth({
            down: dbDown || keyMissing,
            cursorApi: body.cursorApi,
            database: body.database,
          });
        }
      } catch {
        if (!cancelled) setHealth({ down: true });
      }
    };

    probe();
    const id = setInterval(probe, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!health.down) return null;

  const dbDown = health.database === "unavailable";
  const keyMissing = health.cursorApi === "missing";

  return (
    <div
      role="alert"
      className="mo-api-banner"
      style={{
        padding: "12px 16px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid rgba(255,170,0,0.35)",
        backgroundColor: "rgba(255,170,0,0.08)",
        fontSize: 12,
        color: "var(--text-secondary)",
        lineHeight: 1.5,
      }}
    >
      <div style={{ fontWeight: 700, color: "var(--accent-amber)", marginBottom: 6 }}>
        {dbDown ? "Database unavailable" : keyMissing ? "Cursor API key missing" : "DevRoom stack issue"}
      </div>
      {dbDown && (
        <p style={{ margin: 0 }}>
          Run{" "}
          <code style={{ color: "var(--text-primary)" }}>npm run db:push</code> from Cap-DevRoom root, then{" "}
          <code style={{ color: "var(--text-primary)" }}>npm run dev:stack</code>.
        </p>
      )}
      {keyMissing && (
        <p style={{ margin: dbDown ? "8px 0 0" : 0 }}>
          Add <code style={{ color: "var(--text-primary)" }}>CURSOR_API_KEY</code> to{" "}
          <code style={{ color: "var(--text-primary)" }}>dashboard/.env.local</code> for live agent runs.
        </p>
      )}
    </div>
  );
}
